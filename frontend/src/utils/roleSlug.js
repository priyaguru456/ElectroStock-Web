export function roleToSlug(role) {
  return role ? role.toLowerCase().replace(/_/g, "-") : "";
}

export function slugToRole(slug) {
  return slug ? slug.toUpperCase().replace(/-/g, "_") : "";
}
