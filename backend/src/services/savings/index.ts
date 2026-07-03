import { query, queryOne } from "../../db.js";

export interface SavingsGroup {
  id: string;
  name: string;
  owner_id: string;
  contribution_amount: number;
  frequency: string;
  pot: number;
  cycle_index: number;
  invite_code: string;
  created_at: Date;
}

export interface Contribution {
  id: string;
  group_id: string;
  user_id: string;
  amount: number;
  cycle_index: number;
  status: string;
  paid_at: Date | null;
  momo_provider: string;
  momo_reference: string;
  created_at: Date;
}

export async function getSavingsGroupById(groupId: string): Promise<SavingsGroup | null> {
  return queryOne<SavingsGroup>(
    `SELECT * FROM susu_groups WHERE id = $1`,
    [groupId]
  );
}

export async function getSavingsGroupByInviteCode(inviteCode: string): Promise<SavingsGroup | null> {
  return queryOne<SavingsGroup>(
    `SELECT * FROM susu_groups WHERE invite_code = $1`,
    [inviteCode]
  );
}

export async function getGroupMembers(groupId: string) {
  return query(
    `SELECT sm.*, p.display_name, p.business_name, p.avatar_url
     FROM susu_memberships sm
     JOIN profiles p ON sm.user_id = p.id
     WHERE sm.group_id = $1
     ORDER BY sm.payout_order`,
    [groupId]
  );
}

export async function getGroupContributions(groupId: string, cycleIndex?: number): Promise<Contribution[]> {
  if (cycleIndex !== undefined) {
    return query<Contribution>(
      `SELECT * FROM susu_contributions WHERE group_id = $1 AND cycle_index = $2 ORDER BY created_at DESC`,
      [groupId, cycleIndex]
    );
  }
  return query<Contribution>(
    `SELECT * FROM susu_contributions WHERE group_id = $1 ORDER BY created_at DESC`,
    [groupId]
  );
}

export async function calculateAccruedInterest(groupId: string, interestRate: number = 0.05): Promise<number> {
  const group = await getSavingsGroupById(groupId);
  if (!group) return 0;

  const contributions = await getGroupContributions(groupId, group.cycle_index);
  const totalContributions = contributions.reduce((sum, c) => sum + Number(c.amount), 0);

  return Math.round(totalContributions * interestRate * 100) / 100;
}

export async function processContribution(params: {
  groupId: string;
  userId: string;
  amount: number;
  cycleIndex: number;
  momoProvider: string;
  momoReference: string;
}): Promise<Contribution> {
  const contribution = await queryOne<Contribution>(
    `INSERT INTO susu_contributions (group_id, user_id, amount, cycle_index, momo_provider, momo_reference, status, paid_at)
     VALUES ($1, $2, $3, $4, $5, $6, 'paid', NOW())
     RETURNING *`,
    [params.groupId, params.userId, params.amount, params.cycleIndex, params.momoProvider, params.momoReference]
  );

  if (!contribution) throw new Error("Failed to record contribution");

  await query(
    `UPDATE susu_groups SET pot = pot + $1 WHERE id = $2`,
    [params.amount, params.groupId]
  );

  return contribution;
}

export async function checkGroupEligibilityForDisbursement(groupId: string): Promise<{
  eligible: boolean;
  nextRecipient: string | null;
  reason?: string;
}> {
  const group = await getSavingsGroupById(groupId);
  if (!group) return { eligible: false, nextRecipient: null, reason: "Group not found" };

  const members = await getGroupMembers(groupId);
  const contributionCount = await queryOne<{ count: string }>(
    `SELECT COUNT(*) as count FROM susu_contributions WHERE group_id = $1 AND cycle_index = $2 AND status = 'paid'`,
    [groupId, group.cycle_index]
  );

  const totalExpected = members.length;
  const totalPaid = parseInt(contributionCount?.count || "0");

  if (totalPaid < totalExpected) {
    return {
      eligible: false,
      nextRecipient: null,
      reason: `${totalExpected - totalPaid} members have not yet contributed for cycle ${group.cycle_index}`
    };
  }

  const nextMember = members.find((m: any) => !m.has_received);
  if (!nextMember) {
    return { eligible: false, nextRecipient: null, reason: "All members have already received payouts" };
  }

  return { eligible: true, nextRecipient: nextMember.user_id };
}

export async function disbursePot(groupId: string, recipientId: string): Promise<void> {
  const group = await getSavingsGroupById(groupId);
  if (!group) throw new Error("Group not found");
  if (group.pot <= 0) throw new Error("Pot is empty");

  const potAmount = Number(group.pot);

  await query(
    `INSERT INTO susu_payouts (group_id, user_id, amount, paid_at, momo_reference)
     VALUES ($1, $2, $3, NOW(), $4)`,
    [groupId, recipientId, potAmount, `SYS-DISB-${Date.now()}`]
  );

  await query(
    `UPDATE susu_memberships SET has_received = true WHERE group_id = $1 AND user_id = $2`,
    [groupId, recipientId]
  );

  const nextCycle = (group.cycle_index || 1) + 1;
  await query(
    `UPDATE susu_groups SET pot = 0, cycle_index = $1 WHERE id = $2`,
    [nextCycle, groupId]
  );
}

export async function leaveGroup(groupId: string, userId: string): Promise<void> {
  const membership = await queryOne(
    `SELECT * FROM susu_memberships WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );

  if (!membership) throw new Error("Not a member of this group");

  const penaltyAmount = 100;
  const { query: dbQuery } = await import("../../db.js");
  await dbQuery(
    `SELECT withdraw_funds($1, $2, $3, $4)`,
    [userId, penaltyAmount, "Susu Exit Penalty", "Savings"]
  );

  await query(
    `DELETE FROM susu_memberships WHERE group_id = $1 AND user_id = $2`,
    [groupId, userId]
  );
}