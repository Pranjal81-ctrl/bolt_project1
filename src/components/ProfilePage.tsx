import React, { useState, useEffect } from 'react';
import { Camera, User, ArrowLeft, Upload, X } from 'lucide-react';
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
  const [bucketExists, setBucketExists] = useState<boolean | null>(null);

  useEffect(() => {
    if (user) {
      checkBucketExists();
      loadProfilePicture();
    }
  }, [user]);

  const checkBucketExists = async () => {
    try {
      const { data: buckets, error } = await supabase.storage.listBuckets();
      if (error) throw error;
      
      const exists = buckets?.some(bucket => bucket.name === 'profile-pictures') || false;
      setBucketExists(exists);
      
      if (!exists) {
        setError('Profile picture storage is not configured. Please contact support.');
      }
    } catch (err) {
      setBucketExists(false);
      setError('Unable to access profile picture storage.');
    }
  };

  const loadProfilePicture = async () => {
    if (bucketExists === false) return;
    
    try {
      const fileName = `${user?.id}.jpg`;
      const { data } = await supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);
      
      // Check if the file actually exists by trying to fetch it
      try {
        const response = await fetch(data.publicUrl);
        if (response.ok) {
          setProfilePicture(data.publicUrl);
        } else if (response.status === 404) {
          // File doesn't exist - this is expected for users without profile pictures
          setProfilePicture(null);
        } else {
          // Other HTTP errors
          setProfilePicture(null);
        }
      } catch (fetchError) {
        // Network or other fetch errors
        setProfilePicture(null);
      }
    } catch (err) {
      if (bucketExists !== false) {
        console.log('No existing profile picture found');
      }
      setProfilePicture(null);
    }
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !user) return;
    
    if (bucketExists === false) {
      setError('Profile picture storage is not available. Please contact support.');
      return;
    }

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
      
      // Delete existing file if it exists
      await supabase.storage
        .from('profile-pictures')
        .remove([fileName]);

      // Upload new file
      const { error: uploadError } = await supabase.storage
        .from('profile-pictures')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) throw uploadError;

      // Get the public URL
      const { data } = supabase.storage
        .from('profile-pictures')
        .getPublicUrl(fileName);

      setProfilePicture(data.publicUrl + '?t=' + Date.now()); // Add timestamp to force refresh
      setSuccess('Profile picture updated successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to upload image');
    } finally {
      setUploading(false);
    }
  };

  const handleRemovePicture = async () => {
    if (!user || !profilePicture) return;

    setUploading(true);
    setError(null);

    try {
      const fileName = `${user.id}.jpg`;
      const { error } = await supabase.storage
        .from('profile-pictures')
        .remove([fileName]);

      if (error) throw error;

      setProfilePicture(null);
      setSuccess('Profile picture removed successfully!');
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove image');
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-100 to-cyan-100 flex items-center justify-center p-4 font-open-sans">
      <div className="w-full max-w-2xl mx-auto">
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
            <h1 className="text-3xl md:text-4xl font-bold text-gray-800 mb-2">
              Profile Settings
            </h1>
            <p className="text-gray-600">Manage your account information</p>
          </div>

          {/* Profile Picture Section */}
          <div className="mb-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Profile Picture
            </h2>
            
            {/* Profile Picture Display */}
            <div className="flex flex-col items-center mb-6">
              <div className="relative mb-4">
                {profilePicture ? (
                  <div className="relative">
                    <img
                      src={profilePicture}
                      alt="Profile"
                      className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                    />
                    <button
                      onClick={handleRemovePicture}
                      disabled={uploading}
                      className="absolute -top-2 -right-2 bg-red-500 hover:bg-red-600 text-white rounded-full p-2 shadow-lg transition-colors duration-200 disabled:opacity-50"
                      title="Remove profile picture"
                    >
                      <X size={16} />
                    </button>
                  </div>
                ) : (
                  <div className="w-32 h-32 rounded-full bg-gray-100 border-4 border-white shadow-lg flex items-center justify-center">
                    <User size={48} className="text-gray-400" />
                  </div>
                )}
              </div>

              {/* Upload Button */}
              <div className="relative">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileUpload}
                  disabled={uploading || bucketExists === false}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                  id="profile-picture-upload"
                />
                <label
                  htmlFor="profile-picture-upload"
                  className={`flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-blue-500 to-cyan-500 hover:from-blue-600 hover:to-cyan-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 cursor-pointer ${
                    uploading || bucketExists === false ? 'opacity-50 cursor-not-allowed transform-none' : ''
                  }`}
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      Uploading...
                    </>
                  ) : (
                    bucketExists === false ? (
                      'Storage Not Available'
                    ) : (
                    <>
                      <Camera size={20} />
                      Upload Profile Picture
                    </>
                    )
                  )}
                </label>
              </div>

              {/* File Requirements */}
              <p className="text-sm text-gray-500 mt-3 text-center">
                JPG, PNG or GIF • Max 5MB
              </p>
            </div>

            {/* Success Message */}
            {success && (
              <div className="mb-4 p-3 bg-green-50 border border-green-200 text-green-700 rounded-xl text-center">
                {success}
              </div>
            )}

            {/* Error Message */}
            {error && (
              <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-xl text-center">
                {error}
              </div>
            )}
          </div>

          {/* User Information Section */}
          <div className="border-t border-gray-100 pt-8">
            <h2 className="text-xl font-semibold text-gray-800 mb-6 text-center">
              Account Information
            </h2>
            
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
              
              <div className="bg-gray-50 rounded-xl p-4">
                <label className="block text-sm font-semibold text-gray-700 mb-1">
                  Member Since
                </label>
                <p className="text-gray-900">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString() : 'Unknown'}
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