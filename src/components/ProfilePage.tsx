import React, { useState, useEffect } from 'react';
import { ArrowLeft, Upload, User } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { supabase } from '../lib/supabase';

interface ProfilePageProps {
  onBack: () => void;
}

function ProfilePage({ onBack }: ProfilePageProps) {
  const { user } = useAuth();
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (user) {
      loadProfilePicture();
    }
  }, [user]);

  const loadProfilePicture = async () => {
    if (!user) return;
    
    try {
      const fileName = `${user.id}.jpg`;
      
      // First check if we can access the bucket
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError || !buckets?.find(b => b.name === 'profile-pictures')) {
        setProfilePicture(null);
        return;
      }
      
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);
      
      // Check if the file exists without triggering error logs
      const response = await fetch(data.publicUrl, { method: 'HEAD' });
      if (response.ok && response.status === 200) {
        setProfilePicture(data.publicUrl);
      } else {
        setProfilePicture(null);
      }
    } catch (err) {
      // Silently handle errors - missing files are expected for new users
      setProfilePicture(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file');
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setError('File size must be less than 5MB');
      return;
    }

    setUploading(true);
    setError(null);
    setSuccess(null);

    try {
      const fileName = `${user.id}.jpg`;
      
      // Check if bucket exists and has proper permissions
      const { data: buckets, error: bucketError } = await supabase.storage.listBuckets();
      if (bucketError || !buckets?.find(b => b.name === 'profile-pictures')) {
        throw new Error('Storage bucket not configured. Please contact support.');
      }
      
      // Upload file to Supabase Storage
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        if (uploadError.message.includes('row-level security policy')) {
          throw new Error('Upload permissions not configured. Please contact support to set up storage policies.');
        }
        throw uploadError;
      }

      // Get the public URL and update state
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      setProfilePicture(data.publicUrl + '?t=' + Date.now());
      setSuccess('Profile picture uploaded successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
      // Reset file input
      event.target.value = '';
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100 flex items-center justify-center p-4 font-open-sans">
      <div className="w-full max-w-lg mx-auto">
        {/* Back Button */}
        <button
          onClick={onBack}
          className="mb-8 flex items-center gap-2 text-blue-600 hover:text-blue-700 font-medium transition-colors duration-200"
        >
          <ArrowLeft size={20} />
          Back to Dashboard
        </button>

        {/* Profile Card */}
        <div className="bg-white rounded-2xl shadow-xl p-8 border border-blue-100">
          {/* Header */}
          <div className="text-center mb-8">
            <h1 className="text-3xl font-bold text-gray-800 mb-2">
              Profile Page
            </h1>
            <p className="text-gray-600">Manage your profile picture</p>
          </div>

          {/* Profile Picture Section */}
          <div className="text-center mb-8">
            {/* Profile Picture Display */}
            <div className="mb-6">
              {profilePicture ? (
                <img
                  src={profilePicture}
                  alt="Profile"
                  className="w-32 h-32 rounded-full object-cover mx-auto border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center mx-auto">
                  <User size={48} className="text-gray-400" />
                </div>
              )}
            </div>

            {/* Upload Button */}
            <div className="relative inline-block">
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                disabled={uploading}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                id="profile-picture-upload"
              />
              <label
                htmlFor="profile-picture-upload"
                className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                  uploading ? 'opacity-50 cursor-not-allowed transform-none' : ''
                }`}
              >
                {uploading ? (
                  <>
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload size={20} />
                    Upload Profile Picture
                  </>
                )}
              </label>
            </div>

            {/* File Requirements */}
            <p className="text-sm text-gray-500 mt-3">
              JPG, PNG or GIF • Max 5MB
            </p>
          </div>

          {/* Success Message */}
          {success && (
            <div className="mb-6 p-4 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center">
              {success}
            </div>
          )}

          {/* Error Message */}
          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
              {error}
            </div>
          )}

          {/* User Information */}
          <div className="border-t border-gray-100 pt-6">
            <div className="space-y-4">
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Name
                </label>
                <p className="text-gray-900">
                  {user?.user_metadata?.name || 'Not provided'}
                </p>
              </div>
              
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Email
                </label>
                <p className="text-gray-900">
                  {user?.email || 'Not provided'}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ProfilePage;