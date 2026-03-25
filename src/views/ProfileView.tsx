import { useState, FormEvent } from 'react';
import { User, Save } from 'lucide-react';
import { StaffProfile } from '../types';
import { PageHeader } from '../components/PageHeader';

interface ProfileViewProps {
  profile: StaffProfile;
  setProfile: (profile: StaffProfile) => void;
}

export const ProfileView = ({ profile, setProfile }: ProfileViewProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleProfileUpdate = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    setProfile({
      name: formData.get('name') as string,
      role: formData.get('role') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      bio: formData.get('bio') as string,
    });
    setIsEditing(false);
  };

  return (
    <div className="max-w-2xl mx-auto space-y-2">
      <PageHeader title="Profile">
        {!isEditing && (
          <button 
            onClick={() => setIsEditing(true)}
            className="bg-slate-800 hover:bg-slate-900 text-white px-6 py-2 rounded-xl font-bold transition-all"
          >
            Edit Profile
          </button>
        )}
      </PageHeader>

      <div className="glass-card overflow-hidden shadow-sm">
        <div className="h-32 bg-indigo-600 relative">
          <div className="absolute -bottom-12 left-8 p-1 glass rounded-2xl shadow-lg">
            <div className="w-24 h-24 glass rounded-xl flex items-center justify-center text-slate-400 dark:text-slate-500">
              <User size={48} />
            </div>
          </div>
        </div>
        <div className="pt-16 px-8 pb-8">
          <form onSubmit={handleProfileUpdate} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Full Name</label>
                {isEditing ? (
                  <input name="name" defaultValue={profile.name} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 glass text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
                ) : (
                  <p className="px-4 py-2 text-slate-900 dark:text-white font-medium">{profile.name}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Role</label>
                {isEditing ? (
                  <input name="role" defaultValue={profile.role} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 glass text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
                ) : (
                  <p className="px-4 py-2 text-slate-900 dark:text-white font-medium">{profile.role}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Email Address</label>
                {isEditing ? (
                  <input name="email" type="email" defaultValue={profile.email} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 glass text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
                ) : (
                  <p className="px-4 py-2 text-slate-900 dark:text-white font-medium">{profile.email}</p>
                )}
              </div>
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Phone Number</label>
                {isEditing ? (
                  <input name="phone" defaultValue={profile.phone} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 glass text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all" required />
                ) : (
                  <p className="px-4 py-2 text-slate-900 dark:text-white font-medium">{profile.phone}</p>
                )}
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-bold text-slate-600 dark:text-slate-300">Bio</label>
              {isEditing ? (
                <textarea name="bio" defaultValue={profile.bio} rows={4} className="w-full px-4 py-2 rounded-lg border border-slate-200 dark:border-slate-700 glass text-slate-900 dark:text-white focus:ring-2 focus:ring-indigo-500 outline-none transition-all resize-none" />
              ) : (
                <p className="px-4 py-2 text-slate-900 dark:text-white font-medium">{profile.bio}</p>
              )}
            </div>
            {isEditing && (
              <div className="flex justify-end gap-2">
                <button type="button" onClick={() => setIsEditing(false)} className="px-6 py-3 rounded-xl font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition-all">Cancel</button>
                <button type="submit" className="bg-indigo-600 hover:bg-indigo-700 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-indigo-600/20 flex items-center gap-2 transition-all active:scale-95">
                  <Save size={20} />
                  Save Changes
                </button>
              </div>
            )}
          </form>
        </div>
      </div>
    </div>
  );
};
