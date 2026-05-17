import { conversationsAPI } from '../services/api';

export function hasAllInstructorsGroup(conversations) {
  for (var i = 0; i < conversations.length; i++) {
    var c = conversations[i];
    if (c.isGroup || c.is_group) {
      var name = c.groupName || c.group_name;
      if (name === 'All Instructors') return true;
    }
  }
  return false;
}

export async function ensureAllInstructorsGroup(users, currentUser) {
  if (!currentUser || (currentUser.role !== 'admin' && currentUser.role !== 'instructor')) {
    return null;
  }

  var staff = [];
  for (var i = 0; i < users.length; i++) {
    if (users[i].role === 'admin' || users[i].role === 'instructor') {
      staff.push(users[i]);
    }
  }
  if (staff.length < 2) return null;

  var participantIds = staff.map(function(u) { return u.id; });

  try {
    return await conversationsAPI.createGroup('All Instructors', participantIds);
  } catch (err) {
    console.log('All Instructors group:', err.message);
    return null;
  }
}
