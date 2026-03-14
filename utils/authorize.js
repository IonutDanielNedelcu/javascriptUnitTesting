function getViewer(context) {
  return context && context.user;
}

function getRoleNames(viewer) {
  return (viewer && viewer.roles || []).map(r => r.name);
}

function authorizeRoles(context, allowedRoles = []) {
  const viewer = getViewer(context);
  if (!viewer) throw new Error('Not authenticated');
  const names = getRoleNames(viewer);
  const ok = allowedRoles.some(r => names.includes(r));
  if (!ok) throw new Error('Not authorized');
}

function authorizeOrSelf(context, targetId, allowedRoles = []) {
  const viewer = getViewer(context);
  if (!viewer) throw new Error('Not authenticated');
  const viewerId = viewer.userID || viewer.id;
  if (viewerId && targetId && viewerId === targetId) return;
  authorizeRoles(context, allowedRoles);
}

module.exports = {
  authorizeRoles,
  authorizeOrSelf,
  getRoleNames,
  getViewer,
};
