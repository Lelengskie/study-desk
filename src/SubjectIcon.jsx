import React from 'react'

const shapes = {
  numerical: <><rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 7h8M8 12h2m4 0h2m-8 4h2m4 0h2"/></>,
  verbal: <><path d="M12 6C9 4 6 4 3 5v14c3-1 6-1 9 1 3-2 6-2 9-1V5c-3-1-6-1-9 1v14"/><path d="M6 9h3m6 0h3M6 13h3m6 0h3"/></>,
  analytical: <><circle cx="12" cy="5" r="2"/><circle cx="5" cy="18" r="2"/><circle cx="19" cy="18" r="2"/><path d="M11 7 6 16m7-9 5 9M7 18h10"/></>,
  filipino: <><path d="M20 15H9l-5 4v-4H3V5h17z"/><path d="M7 9h9m-9 3h5"/></>,
  information: <path d="m3 8 9-5 9 5v2H3zm2 11h14M3 21h18M6 10v9m6-9v9m6-9v9"/>,
  clerical: <><path d="M3 7h7l2 2h9v10H3z"/><path d="M6 13h12m-12 3h8"/></>,
}

export default function SubjectIcon({ subject }) {
  return <span className="journey-icon" aria-hidden="true"><svg viewBox="0 0 24 24" width="25" height="25"
    fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">{shapes[subject]}</svg></span>
}
