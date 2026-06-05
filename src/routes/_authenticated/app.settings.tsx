import { createFileRoute } from "@tanstack/react-router";
import { AppShell, Card } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useProfile, useUpdateProfile, useUploadAvatar, useDeleteAccount, useCreateReferral, useMyReferrals } from "@/lib/app-queries";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import {
  User,
  Building,
  MapPin,
  Phone,
  Camera,
  Save,
  Loader2,
  Briefcase,
  Trash2,
  AlertTriangle,
  UserPlus,
  Mail,
  Share2
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/app/settings")({
  component: SettingsPage,
});

const GHANA_REGIONS = [
  "Greater Accra", "Ashanti", "Central", "Eastern", "Western",
  "Western North", "Volta", "Oti", "Bono", "Bono East",
  "Ahafo", "Northern", "Savannah", "North East", "Upper East", "Upper West"
];

const BUSINESS_TYPES = [
  "Barber", "Hairdresser", "Stylist", "Makeup Artist",
  "Nail Technician", "Wholesaler", "Other"
];

function SettingsPage() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();
  const uploadAvatar = useUploadAvatar();
  const deleteAccount = useDeleteAccount();
  const createReferral = useCreateReferral();
  const referrals = useMyReferrals();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [referralEmail, setReferralEmail] = useState("");

  const [formData, setFormData] = useState({
    display_name: "",
    business_name: "",
    business_type: "Barber",
    location: "",
    phone_number: "",
    bio: "",
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        display_name: profile.display_name || "",
        business_name: profile.business_name || "",
        business_type: profile.business_type || "Barber",
        location: profile.location || "",
        phone_number: profile.phone_number || "",
        bio: profile.bio || "",
      });
    }
  }, [profile]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    try {
      await updateProfile.mutateAsync(formData);
      toast.success("Profile details saved!");
    } catch (e) {
      toast.error("Failed to update profile");
    }
  }

  async function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Photo too large. Max size is 2MB.");
      return;
    }

    try {
      toast.promise(uploadAvatar.mutateAsync(file), {
        loading: 'Uploading photo...',
        success: 'Profile photo updated!',
        error: 'Failed to upload photo',
      });
    } catch (err) {
      console.error(err);
    }
  }

  const handleDeleteAccount = async () => {
    try {
      await deleteAccount.mutateAsync();
      toast.success("Account deleted successfully.");
    } catch (err) {
      toast.error("Failed to delete account.");
    }
  };

  const handleReferral = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!referralEmail.trim()) return;
    try {
      await createReferral.mutateAsync(referralEmail);
      setReferralEmail("");
      toast.success("Referral invitation logged!", {
        description: "You'll get +50 ClipScore when they join."
      });
    } catch (e) { toast.error("Failed to send referral"); }
  };

  if (isLoading) {
    return (
      <AppShell title="Settings">
        <div className="flex justify-center py-20">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </AppShell>
    );
  }

  return (
    <AppShell title="Business Settings">
      <div className="max-w-2xl mx-auto space-y-6 pb-12">
        <Card className="relative overflow-hidden shadow-sm">
          <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-r from-primary/10 to-gold/10" />

          <div className="relative pt-12 pb-4 flex flex-col items-center">
            <div className="relative group">
              <div className="h-24 w-24 rounded-full bg-surface-elevated border-4 border-background flex items-center justify-center overflow-hidden shadow-xl">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="w-10 h-10 text-muted-foreground" />
                )}
                {uploadAvatar.isPending && (
                  <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                    <Loader2 className="w-6 h-6 animate-spin text-white" />
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="absolute bottom-0 right-0 p-2 bg-primary text-white rounded-full shadow-lg hover:scale-110 transition-transform"
                disabled={uploadAvatar.isPending}
              >
                <Camera className="w-4 h-4" />
              </button>
              <input
                type="file"
                ref={fileInputRef}
                onChange={onFileChange}
                accept="image/*"
                className="hidden"
              />
            </div>
            <h2 className="mt-4 text-xl font-display font-bold">{profile?.display_name || "Artisan"}</h2>
            <p className="text-sm text-muted-foreground">{profile?.business_name || "Shop Owner"}</p>
          </div>

          <form onSubmit={handleSave} className="space-y-5 p-6 border-t border-border/50">
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={formData.display_name}
                    onChange={(e) => setFormData({...formData, display_name: e.target.value})}
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">MoMo Number</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={formData.phone_number}
                    onChange={(e) => setFormData({...formData, phone_number: e.target.value})}
                    placeholder="024 XXX XXXX"
                    className="pl-10 h-11 rounded-xl font-bold"
                  />
                </div>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Business Name</Label>
                <div className="relative">
                  <Building className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <Input
                    value={formData.business_name}
                    onChange={(e) => setFormData({...formData, business_name: e.target.value})}
                    className="pl-10 h-11 rounded-xl"
                  />
                </div>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Business Type</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                  <select
                    value={formData.business_type}
                    onChange={(e) => setFormData({...formData, business_type: e.target.value})}
                    className="w-full pl-10 h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
                  >
                    {BUSINESS_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">Region in Ghana</Label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
                <select
                  value={formData.location}
                  onChange={(e) => setFormData({...formData, location: e.target.value})}
                  className="w-full pl-10 h-11 rounded-xl border border-input bg-background px-3 text-sm font-bold focus:ring-1 focus:ring-primary outline-none appearance-none"
                >
                  <option value="">Select Region</option>
                  {GHANA_REGIONS.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs font-bold uppercase text-muted-foreground ml-1">About Your Shop (Bio)</Label>
              <textarea
                value={formData.bio}
                onChange={(e) => setFormData({...formData, bio: e.target.value})}
                placeholder="Tell us about your services..."
                className="w-full min-h-[100px] p-3 rounded-xl border border-input bg-background text-sm focus:ring-1 focus:ring-primary outline-none"
              />
            </div>

            <Button
              type="submit"
              className="w-full h-12 rounded-xl font-bold shadow-lg shadow-primary/20 gap-2"
              disabled={updateProfile.isPending}
            >
              {updateProfile.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Professional Profile
            </Button>
          </form>
        </Card>

        {/* Referral Section */}
        <Card className="bg-gold/5 border-gold/20 p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="h-10 w-10 rounded-full bg-gold/10 flex items-center justify-center text-gold">
              <UserPlus className="w-5 h-5" />
            </div>
            <h3 className="font-display font-bold text-lg text-gold">Invite fellow artisans</h3>
          </div>
          <p className="text-sm text-muted-foreground mb-6">
            Get <span className="font-bold text-primary">+50 ClipScore</span> for every barber or stylist you refer who joins ClipCapital.
          </p>

          <form onSubmit={handleReferral} className="flex gap-2">
            <div className="relative flex-1">
              <Mail className="absolute left-3 top-3 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder="colleague@email.com"
                className="pl-10 h-11 rounded-xl bg-background"
                value={referralEmail}
                onChange={e => setReferralEmail(e.target.value)}
                required
              />
            </div>
            <Button type="submit" className="bg-gold hover:bg-gold/90 text-black font-bold h-11 rounded-xl px-6" disabled={createReferral.isPending}>
              Invite
            </Button>
          </form>

          {referrals.data && referrals.data.length > 0 && (
            <div className="mt-6 space-y-2">
              <div className="text-[10px] font-black uppercase text-gold/60 tracking-widest">Pending Invites</div>
              {referrals.data.map(r => (
                <div key={r.id} className="flex items-center justify-between text-[11px] bg-background border border-gold/10 p-2 rounded-lg">
                  <span className="font-medium">{r.referee_email}</span>
                  <span className="font-bold text-gold uppercase">{r.status}</span>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Account Deletion */}
        <Card className="border-red-500/20 bg-red-500/5 p-6">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h3 className="font-display font-bold text-red-600">Danger Zone</h3>
          </div>
          <p className="text-sm text-red-700/70 mb-6 leading-relaxed">
            Deleting your account will permanently remove all your data. This action cannot be undone.
          </p>

          <Dialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
            <DialogTrigger asChild>
              <Button variant="outline" className="w-full border-red-200 text-red-600 hover:bg-red-600 hover:text-white transition-all font-bold rounded-xl h-11">
                <Trash2 className="w-4 h-4 mr-2" /> Delete My Account
              </Button>
            </DialogTrigger>
            <DialogContent className="rounded-3xl">
              <DialogHeader>
                <DialogTitle className="text-red-600">Are you absolutely sure?</DialogTitle>
                <DialogDescription>
                  This will permanently delete your ClipCapital account. You will lose your hard-earned ClipScore.
                </DialogDescription>
              </DialogHeader>
              <DialogFooter className="gap-2 mt-4">
                <Button variant="ghost" onClick={() => setShowDeleteConfirm(false)} className="font-bold">Cancel</Button>
                <Button variant="destructive" onClick={handleDeleteAccount} className="font-bold">Yes, Delete Permanently</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </Card>
      </div>
    </AppShell>
  );
}
