import { Navigate, useParams } from "react-router-dom";

/**
 * Legacy /u/:username route — permanently redirects to the canonical
 * /score/:username path. SPA hosting can't emit a real 301, but:
 *   - <Navigate replace> drops /u/... from history (no back-button loop)
 *   - <link rel="canonical"> on /score/:username already points search
 *     engines at the canonical URL, deduplicating the SEO signal.
 */
const LegacyUserRedirect = () => {
  const { username } = useParams();
  if (!username) return <Navigate to="/" replace />;
  return <Navigate to={`/score/${username}`} replace />;
};

export default LegacyUserRedirect;
