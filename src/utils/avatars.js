export const AVATAR_OPTIONS = [
  { id: 'avatar-1', image: `${import.meta.env.BASE_URL}avatars/avatar-1.png`, name: 'Faculty 1' },
  { id: 'avatar-2', image: `${import.meta.env.BASE_URL}avatars/avatar-2.png`, name: 'Faculty 2' },
  { id: 'avatar-3', image: `${import.meta.env.BASE_URL}avatars/avatar-3.png`, name: 'Faculty 3' },
  { id: 'avatar-4', image: `${import.meta.env.BASE_URL}avatars/avatar-4.png`, name: 'Faculty 4' },
  { id: 'avatar-5', image: `${import.meta.env.BASE_URL}avatars/avatar-5.png`, name: 'Faculty 5' },
  { id: 'avatar-6', image: `${import.meta.env.BASE_URL}avatars/avatar-6.png`, name: 'Faculty 6' },
  { id: 'avatar-7', image: `${import.meta.env.BASE_URL}avatars/avatar-7.png`, name: 'Faculty 7' },
  { id: 'avatar-8', image: `${import.meta.env.BASE_URL}avatars/avatar-8.png`, name: 'Faculty 8' },
  { id: 'avatar-9', image: `${import.meta.env.BASE_URL}avatars/avatar-9.png`, name: 'Faculty 9' },
  { id: 'avatar-10', image: `${import.meta.env.BASE_URL}avatars/avatar-10.png`, name: 'Faculty 10' }
];

export const getAvatarSrc = (avatarId, profilePicture) => {
  if (profilePicture && typeof profilePicture === 'string' && profilePicture.trim() !== '') {
    return profilePicture;
  }
  if (!avatarId) return `${import.meta.env.BASE_URL}avatars/avatar-1.png`;
  if (avatarId.startsWith('data:') || avatarId.startsWith('http') || avatarId.startsWith('/')) {
    return avatarId;
  }

  const map = {
    'default': `${import.meta.env.BASE_URL}avatars/avatar-1.png`,
    'green': `${import.meta.env.BASE_URL}avatars/avatar-2.png`,
    'blue': `${import.meta.env.BASE_URL}avatars/avatar-4.png`,
    'purple': `${import.meta.env.BASE_URL}avatars/avatar-6.png`,
    'red': `${import.meta.env.BASE_URL}avatars/avatar-8.png`,
    'yellow': `${import.meta.env.BASE_URL}avatars/avatar-3.png`
  };

  if (map[avatarId]) return map[avatarId];
  if (avatarId.startsWith('avatar-')) return `${import.meta.env.BASE_URL}avatars/${avatarId}.png`;

  return `${import.meta.env.BASE_URL}avatars/avatar-1.png`;
};

export const getStudentPhotoSrc = (photo, gender) => {
  if (photo && typeof photo === 'string' && photo.trim() !== '') {
    if (photo.startsWith('data:') || photo.startsWith('http')) return photo;
    if (photo.startsWith('id-photos/')) return `${import.meta.env.BASE_URL}${photo}`;
    if (photo.startsWith('/id-photos/')) return `${import.meta.env.BASE_URL}${photo.slice(1)}`;
    return photo;
  }
  const isFemale = String(gender || '').toLowerCase().includes('fem') || String(gender || '').toLowerCase() === 'f';
  return isFemale
    ? `${import.meta.env.BASE_URL}id-photos/female-1.jpg`
    : `${import.meta.env.BASE_URL}id-photos/male-1.jpg`;
};

export const getStudentRegFormSrc = (regPhoto, dept) => {
  if (regPhoto && typeof regPhoto === 'string' && regPhoto.trim() !== '') {
    if (regPhoto.startsWith('data:') || regPhoto.startsWith('http')) return regPhoto;
    if (regPhoto.startsWith('id-photos/')) return `${import.meta.env.BASE_URL}${regPhoto}`;
    if (regPhoto.startsWith('/id-photos/')) return `${import.meta.env.BASE_URL}${regPhoto.slice(1)}`;
    return regPhoto;
  }
  const track = String(dept || 'CWTS').toUpperCase();
  if (track.includes('ROTC')) return `${import.meta.env.BASE_URL}id-photos/cor-rotc.jpg`;
  if (track.includes('LTS')) return `${import.meta.env.BASE_URL}id-photos/cor-lts.jpg`;
  return `${import.meta.env.BASE_URL}id-photos/cor-cwts.jpg`;
};
