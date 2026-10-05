// Every static (non-AI-generated) UI string in the app, in both languages.
// The AI's actual answers are translated separately, server-side, by the RAG pipeline itself
// (see backend/src/services/claude.js) - this file only covers interface chrome: nav labels,
// buttons, placeholders, empty states, etc.
export const translations = {
  // Sidebar
  "nav.home": { en: "Home", sw: "Nyumbani" },
  "nav.home.sub": { en: "Overview & AI assistant", sw: "Muhtasari na msaidizi wa AI" },
  "nav.constitution": { en: "Constitution", sw: "Katiba" },
  "nav.constitution.sub": { en: "The Constitution of Kenya, 2010", sw: "Katiba ya Kenya, 2010" },
  "nav.laws": { en: "Laws", sw: "Sheria" },
  "nav.laws.sub": { en: "Acts & Statutes", sw: "Sheria na Mashiria" },
  "nav.caseLaw": { en: "Case Law", sw: "Kesi za Mahakama" },
  "nav.caseLaw.sub": { en: "Judgments & Decisions", sw: "Hukumu na Maamuzi" },
  "nav.topics": { en: "Topics", sw: "Mada" },
  "nav.topics.sub": { en: "Legal Topics A-Z", sw: "Mada za Kisheria A-Z" },
  "nav.ask": { en: "Ask Katiba AI", sw: "Uliza Katiba AI" },
  "nav.ask.sub": { en: "AI Legal Assistant", sw: "Msaidizi wa Kisheria wa AI" },
  "nav.lawyers": { en: "Lawyer Directory", sw: "Orodha ya Mawakili" },
  "nav.lawyers.sub": { en: "Verified Advocates", sw: "Mawakili Waliothibitishwa" },
  "nav.messages": { en: "Messages", sw: "Ujumbe" },
  "nav.messages.sub": { en: "Chat with your advocate", sw: "Ongea na wakili wako" },
  "nav.myRequests": { en: "My Requests", sw: "Maombi Yangu" },
  "nav.myRequests.sub": { en: "Consultation requests", sw: "Maombi ya ushauri" },
  "nav.saved": { en: "Saved", sw: "Zilizohifadhiwa" },
  "nav.saved.sub": { en: "Bookmarks & History", sw: "Alamisho na Historia" },
  "nav.about": { en: "About Us", sw: "Kutuhusu" },
  "nav.about.sub": { en: "About Katiba AI", sw: "Kuhusu Katiba AI" },
  "nav.settings": { en: "Settings", sw: "Mipangilio" },
  "nav.settings.sub": { en: "Profile & preferences", sw: "Wasifu na mapendeleo" },
  "sidebar.tagline": { en: "Know. Understand. Empower.", sw: "Jua. Elewa. Wezesha." },
  "sidebar.mission.title": { en: "Your rights. Our mission.", sw: "Haki zako. Dhamira yetu." },
  "sidebar.mission.body": {
    en: "Reliable legal information for every Kenyan, in English and Kiswahili.",
    sw: "Taarifa za kisheria za kuaminika kwa kila Mkenya, kwa Kiingereza na Kiswahili.",
  },

  // Topbar
  "topbar.search": { en: "Search Constitution, laws, cases, topics...", sw: "Tafuta Katiba, sheria, kesi, mada..." },
  "topbar.darkMode.toLight": { en: "Switch to light mode", sw: "Badilisha hadi hali ya mwanga" },
  "topbar.darkMode.toDark": { en: "Switch to dark mode", sw: "Badilisha hadi hali ya giza" },
  "topbar.notifications": { en: "Notifications", sw: "Arifa" },

  // Home
  "home.welcome": { en: "Karibu, Katiba AI 👋", sw: "Karibu, Katiba AI 👋" },
  "home.subtitle": {
    en: "Find accurate answers about the Constitution of Kenya, laws, and your rights.",
    sw: "Pata majibu sahihi kuhusu Katiba ya Kenya, sheria, na haki zako.",
  },
  "home.ask.title": { en: "Ask Katiba AI", sw: "Uliza Katiba AI" },
  "home.ask.subtitle": { en: "Get instant answers to your legal questions.", sw: "Pata majibu ya haraka kwa maswali yako ya kisheria." },
  "home.ask.placeholder": {
    en: "Ask anything about the Constitution, laws, or your rights...",
    sw: "Uliza chochote kuhusu Katiba, sheria, au haki zako...",
  },
  "home.ask.speak": { en: "Speak", sw: "Sema" },
  "home.ask.button": { en: "Ask", sw: "Uliza" },
  "home.ask.thinking": { en: "Thinking...", sw: "Ninafikiria..." },
  "home.tryAsking": { en: "Try asking:", sw: "Jaribu kuuliza:" },
  "home.loadingChapters": { en: "Loading chapters…", sw: "Inapakia sura…" },
  "home.noChapters": {
    en: "No chapters indexed yet. Run `npm run seed` in the backend to load the Constitution.",
    sw: "Hakuna sura zilizowekwa bado. Endesha `npm run seed` kwenye backend kupakia Katiba.",
  },
  "home.articleCount": { en: "articles", sw: "vifungu" },
  "home.quickAccess": { en: "Quick Access", sw: "Ufikiaji wa Haraka" },
  "home.quickAccess.search": { en: "Search Constitution", sw: "Tafuta Katiba" },
  "home.quickAccess.laws": { en: "Browse Laws", sw: "Vinjari Sheria" },
  "home.quickAccess.judgments": { en: "Latest Judgments", sw: "Hukumu za Hivi Karibuni" },
  "home.quickAccess.topics": { en: "Popular Topics", sw: "Mada Maarufu" },
  "home.quickAccess.faq": { en: "Frequently Asked Questions", sw: "Maswali Yanayoulizwa Mara kwa Mara" },
  "home.popularQuestions": { en: "Popular Questions", sw: "Maswali Maarufu" },
  "home.popularQuestions.empty": {
    en: "No questions asked yet — be the first, and they'll show up here for everyone.",
    sw: "Hakuna maswali yaliyoulizwa bado — kuwa wa kwanza, nayo yataonekana hapa kwa kila mtu.",
  },
  "home.recentlyViewed": { en: "Recently Viewed", sw: "Iliyoangaliwa Hivi Karibuni" },
  "home.recentlyViewed.empty": { en: "Questions you ask will show up here.", sw: "Maswali unayouliza yataonekana hapa." },
  "home.loading": { en: "Loading…", sw: "Inapakia…" },
  "home.error.default": {
    en: "Couldn't reach Katiba AI right now. Check that the backend is running.",
    sw: "Imeshindwa kufikia Katiba AI sasa hivi. Hakikisha backend inaendesha.",
  },

  // Chat page
  "chat.title": { en: "Ask Katiba AI", sw: "Uliza Katiba AI" },
  "chat.intro": {
    en: 'Ask a direct question, or describe what happened to you - in English or Kiswahili. E.g. "jana nilipigwa na wezi, nifanye nini?"',
    sw: 'Uliza swali moja kwa moja, au eleza kilichokutokea - kwa Kiingereza au Kiswahili. Mfano: "jana nilipigwa na wezi, nifanye nini?"',
  },
  "chat.placeholder": {
    en: "Ask anything about the Constitution, laws, or your rights...",
    sw: "Uliza chochote kuhusu Katiba, sheria, au haki zako...",
  },
  "chat.thinking": { en: "Thinking...", sw: "Ninafikiria..." },
  "chat.urgent": {
    en: "This sounds urgent. If you're in danger right now, call ",
    sw: "Hii inasikika ni dharura. Ikiwa uko hatarini sasa hivi, piga simu ",
  },

  // Answer page
  "answer.back": { en: "Back", sw: "Rudi" },
  "answer.urgent": {
    en: "This sounds urgent. If you're in danger right now, call the Police on",
    sw: "Hii inasikika ni dharura. Ikiwa uko hatarini sasa hivi, piga simu Polisi kwa",
  },
  "answer.urgent.suffix": {
    en: "or go to the nearest hospital or police station immediately.",
    sw: "au nenda kituo cha polisi au hospitali iliyo karibu mara moja.",
  },
  "answer.helpful": { en: "Was this answer helpful?", sw: "Je, jibu hili lilikuwa la msaada?" },
  "answer.followUp.placeholder": { en: "Ask a follow-up question...", sw: "Uliza swali la ziada..." },
  "answer.relevantArticles": { en: "Relevant Articles", sw: "Vifungu Husika" },
  "answer.relevantArticles.empty": {
    en: "No specific articles were retrieved for this answer.",
    sw: "Hakuna vifungu mahususi vilivyopatikana kwa jibu hili.",
  },
  "answer.viewInConstitution": { en: "View in Constitution", sw: "Angalia katika Katiba" },
  "answer.disclaimer": {
    en: "Katiba AI gives general legal information based on the Constitution of Kenya and other laws. It does not replace professional legal advice — for a specific case, consult a qualified advocate.",
    sw: "Katiba AI hutoa taarifa za jumla za kisheria kulingana na Katiba ya Kenya na sheria zingine. Haibadilishi ushauri wa kitaalamu wa kisheria — kwa kesi mahususi, wasiliana na wakili aliyehitimu.",
  },
  "answer.noQuestion": { en: "No question asked yet.", sw: "Hakuna swali lililoulizwa bado." },
  "answer.goAsk": { en: "Go ask Katiba AI", sw: "Nenda uliza Katiba AI" },

  // Footer
  "footer.disclaimer": {
    en: "Katiba AI can make mistakes. Always verify important information.",
    sw: "Katiba AI inaweza kufanya makosa. Hakikisha kila mara taarifa muhimu.",
  },

  // Placeholder page
  "placeholder.back": { en: "Back to Home", sw: "Rudi Nyumbani" },
  "placeholder.default": { en: "This page isn't built yet - it's next on the roadmap.", sw: "Ukurasa huu haujajengwa bado - ndio ijayo kwenye ramani." },

  // Constitution browser
  "constitution.title": { en: "The Constitution of Kenya, 2010", sw: "Katiba ya Kenya, 2010" },
  "constitution.subtitle": {
    en: "Browse chapter by chapter, in plain language you can verify against the original text.",
    sw: "Vinjari sura kwa sura, kwa lugha rahisi unayoweza kuthibitisha dhidi ya maandishi asili.",
  },
  "constitution.allChapters": { en: "All Chapters", sw: "Sura Zote" },
  "constitution.loadingArticles": { en: "Loading articles…", sw: "Inapakia vifungu…" },
  "constitution.noArticles": { en: "No articles found in this chapter yet.", sw: "Hakuna vifungu vilivyopatikana katika sura hii bado." },
  "constitution.article": { en: "Article", sw: "Kifungu" },

  // Laws browser
  "laws.title": { en: "Laws & Acts of Parliament", sw: "Sheria na Mashiria ya Bunge" },
  "laws.subtitle": {
    en: "Beyond the Constitution - Acts that cover everyday situations like employment, land, and crime.",
    sw: "Zaidi ya Katiba - Sheria zinazohusu hali za kila siku kama ajira, ardhi, na uhalifu.",
  },
  "laws.loading": { en: "Loading laws…", sw: "Inapakia sheria…" },
  "laws.none": {
    en: "No laws indexed yet beyond the Constitution. Run `npm run seed` in the backend.",
    sw: "Hakuna sheria zilizowekwa bado zaidi ya Katiba. Endesha `npm run seed` kwenye backend.",
  },
  "laws.allLaws": { en: "All Laws", sw: "Sheria Zote" },
  "laws.notLegislation": { en: "Practical guide, not law", sw: "Mwongozo wa vitendo, si sheria" },
  "laws.section": { en: "Section", sw: "Kifungu" },

  // Case Law browser
  "caseLaw.title": { en: "Case Law of Kenya", sw: "Kesi za Mahakama za Kenya" },
  "caseLaw.subtitle": {
    en: "Real Kenyan court decisions, organised by area of law.",
    sw: "Maamuzi halisi ya mahakama za Kenya, yaliyopangwa kwa eneo la sheria.",
  },
  "caseLaw.loading": { en: "Loading case law…", sw: "Inapakia kesi za mahakama…" },
  "caseLaw.loadingCases": { en: "Loading cases…", sw: "Inapakia kesi…" },
  "caseLaw.none": { en: "No case law indexed yet.", sw: "Hakuna kesi za mahakama zilizowekwa bado." },
  "caseLaw.noCases": { en: "No cases found in this category yet.", sw: "Hakuna kesi zilizopatikana katika kundi hili bado." },
  "caseLaw.allCategories": { en: "All Categories", sw: "Makundi Yote" },
  "caseLaw.cases": { en: "cases", sw: "kesi" },

  // Topics browser
  "topics.title": { en: "Legal Topics A-Z", sw: "Mada za Kisheria A-Z" },
  "topics.subtitle": {
    en: "Browse by everyday topic - each one pulls together everything relevant across the Constitution, Acts, and case law.",
    sw: "Vinjari kwa mada ya kila siku - kila moja hukusanya kila kitu husika kutoka Katiba, Sheria, na kesi za mahakama.",
  },
  "topics.loading": { en: "Loading topics…", sw: "Inapakia mada…" },
  "topics.none": { en: "No topics indexed yet.", sw: "Hakuna mada zilizowekwa bado." },
  "topics.allTopics": { en: "All Topics", sw: "Mada Zote" },
  "topics.acrossLaws": {
    en: "Results from across the Constitution, Acts, and case law.",
    sw: "Matokeo kutoka Katiba, Sheria, na kesi za mahakama.",
  },
  "topics.loadingResults": { en: "Loading…", sw: "Inapakia…" },
  "topics.noResults": { en: "Nothing found for this topic yet.", sw: "Hakuna kilichopatikana kwa mada hii bado." },

  // About page
  "about.title": { en: "About Katiba AI", sw: "Kuhusu Katiba AI" },
  "about.mission": {
    en: "Katiba AI exists so that every Kenyan - not just lawyers - can understand the Constitution, the laws that affect their daily life, and what to do when their rights are at stake.",
    sw: "Katiba AI ipo ili kila Mkenya - si mawakili tu - aweze kuelewa Katiba, sheria zinazoathiri maisha yake ya kila siku, na afanye nini haki zake zinapokuwa hatarini.",
  },
  "about.howItWorks": { en: "How it works", sw: "Jinsi inavyofanya kazi" },
  "about.step1.title": { en: "You ask, in your own words", sw: "Unauliza, kwa maneno yako mwenyewe" },
  "about.step1.body": {
    en: "In English or Kiswahili - a direct question, or just describe what happened to you.",
    sw: "Kwa Kiingereza au Kiswahili - swali moja kwa moja, au eleza tu kilichokutokea.",
  },
  "about.step2.title": { en: "We search the real law", sw: "Tunatafuta sheria halisi" },
  "about.step2.body": {
    en: "The Constitution, Acts of Parliament, and case law are searched for what's actually relevant - not guessed from memory.",
    sw: "Katiba, Sheria za Bunge, na kesi za mahakama hutafutwa kwa kile kilicho husika - si kubahatisha.",
  },
  "about.step3.title": { en: "You get a plain-language answer", sw: "Unapata jibu la lugha rahisi" },
  "about.step3.body": {
    en: "With the exact Article or Section cited, so you can verify it yourself.",
    sw: "Ikiwa na Kifungu au Ibara mahususi, ili uweze kuthibitisha mwenyewe.",
  },
  "about.languages.title": { en: "English and Kiswahili, fully", sw: "Kiingereza na Kiswahili, kikamilifu" },
  "about.languages.body": {
    en: "Ask in whichever language you're comfortable in - the answer comes back in the same language, not just translated afterward.",
    sw: "Uliza kwa lugha unayoifahamu - jibu hurudi kwa lugha hiyo hiyo, si kutafsiriwa baadaye.",
  },
  "about.coverage.title": { en: "What's covered right now", sw: "Kinachoshughulikiwa sasa hivi" },
  "about.coverage.loading": { en: "Loading…", sw: "Inapakia…" },
  "about.coverage.entries": { en: "entries indexed", sw: "vipengele vilivyowekwa" },
  "about.coverage.empty": { en: "Nothing indexed yet.", sw: "Hakuna kilichowekwa bado." },
  "about.coverage.browse": { en: "Browse the full list", sw: "Vinjari orodha kamili" },
  "about.disclaimer.title": { en: "This is civic education, not legal advice", sw: "Hii ni elimu ya uraia, si ushauri wa kisheria" },
  "about.disclaimer.body": {
    en: "Katiba AI can make mistakes, and general information isn't a substitute for a qualified advocate who knows the specifics of your situation. For a live legal matter, consult an advocate, the Kenya National Human Rights Commission (KNCHR), or the National Legal Aid Service.",
    sw: "Katiba AI inaweza kufanya makosa, na taarifa za jumla hazibadilishi wakili aliyehitimu anayejua maelezo ya hali yako. Kwa suala la kisheria linaloendelea, wasiliana na wakili, Tume ya Kitaifa ya Haki za Kibinadamu (KNCHR), au Huduma ya Kitaifa ya Msaada wa Kisheria.",
  },
};

/** Look up a string in the current language, falling back to English if the key or language is missing. */
export function translate(key, lang) {
  const entry = translations[key];
  if (!entry) {
    console.warn(`[i18n] Missing translation key: "${key}"`);
    return key;
  }
  return entry[lang] || entry.en;
}