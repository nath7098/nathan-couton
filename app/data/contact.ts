/** Contact details, carried over from the v1 site. */
export const CONTACT = {
  email: 'contact@nathancouton.fr',
  phone: '0646898223',
  /** Pretty-printed for display; `phone` stays raw for tel: and clipboard. */
  phoneDisplay: '06 46 89 82 23',
  /** One per language, generated from the site's data by `npm run cv`. */
  resume: { fr: '/cv/CV_Nathan_Couton.pdf', en: '/cv/CV_Nathan_Couton_EN.pdf' },
  /** What the file is saved as: explicit, for a recruiter's downloads folder. */
  resumeName: {
    fr: 'Nathan-Couton-CV-Developpeur-Fullstack-Java.pdf',
    en: 'Nathan-Couton-Resume-Fullstack-Java-Developer.pdf',
  },
  social: [
    { id: 'linkedin', href: 'https://www.linkedin.com/in/nathan-couton/', label: 'LinkedIn' },
    { id: 'github', href: 'https://github.com/nath7098', label: 'GitHub' },
    { id: 'gitlab', href: 'https://gitlab.com/nath7098', label: 'GitLab' },
  ],
} as const
