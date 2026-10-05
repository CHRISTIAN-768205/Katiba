import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  HelpCircle,
  Search,
  ChevronDown,
  MessageCircle,
  Gavel,
  Handshake,
  FileText,
  ShieldCheck,
  Scale,
  Mail,
} from "lucide-react";

// ============================================================
// FAQ DATA
// ============================================================
const FAQ_DATA = [
  {
    category: "Getting Started",
    icon: HelpCircle,
    items: [
      {
        q: "What is Katiba AI?",
        a: "Katiba AI is a free legal information assistant for Kenya. It helps you understand the Constitution of Kenya, 2010, and other laws in plain language, and connects you with verified advocates and mediators when you need professional help.",
      },
      {
        q: "Is Katiba AI really free?",
        a: "Yes. Reading the Constitution, browsing laws, and asking basic questions is completely free. Some advanced features (like unlimited AI questions or document summarisation) may require a paid plan in the future, but the core service will always remain free for every Kenyan.",
      },
      {
        q: "Do I need to create an account?",
        a: "You can browse the Constitution and laws without an account. To save answers, request consultations, or message advocates and mediators, you'll need to sign up — it takes less than a minute.",
      },
      {
        q: "Is Katiba AI available in Kiswahili?",
        a: "Yes. Katiba AI supports both English and Kiswahili. You can switch languages using the EN/SW toggle in the sidebar, and the AI will respond in the language you choose.",
      },
    ],
  },
  {
    category: "Using the AI",
    icon: MessageCircle,
    items: [
      {
        q: "Is the AI giving me legal advice?",
        a: "No. Katiba AI provides general legal information, not legal advice. It cannot replace a qualified advocate who understands your specific situation. Always consult a licensed professional before making legal decisions.",
      },
      {
        q: "How accurate are the AI's answers?",
        a: "Katiba AI grounds its answers in the official text of Kenyan law and cites its sources. However, AI can make mistakes. Always verify important information against the original law or with a qualified advocate.",
      },
      {
        q: "What languages can I ask in?",
        a: "You can ask in English, Kiswahili, or a mix of both (including Sheng). The AI will detect your language and respond accordingly.",
      },
      {
        q: "Can I describe my situation instead of asking a legal question?",
        a: "Yes. Katiba AI understands natural language. You can describe what happened in your own words — for example, \"My landlord locked me out yesterday\" — and the AI will identify the relevant legal topics and rights.",
      },
      {
        q: "Can I save the AI's answers?",
        a: "Yes. Once you're signed in, you can bookmark answers and access them anytime from the Saved Answers page.",
      },
    ],
  },
  {
    category: "Advocates & Mediators",
    icon: Gavel,
    items: [
      {
        q: "How do I find an advocate or mediator?",
        a: "Use the Lawyer Directory to browse verified professionals by practice area or specialty. You can read their profiles, reviews, and fee ranges, then send a consultation request directly from their profile.",
      },
      {
        q: "How are advocates and mediators verified?",
        a: "Every advocate's Bar Number is checked against the Law Society of Kenya (LSK) records, and every mediator's MAC Number is verified with the Mediation Accreditation Committee. Only verified professionals appear in the public directory.",
      },
      {
        q: "How much does a consultation cost?",
        a: "Fees vary by professional. Each advocate and mediator lists their fee range on their profile. Some also offer pro bono (free) consultations — look for the 'Pro Bono' badge.",
      },
      {
        q: "What's the difference between an advocate and a mediator?",
        a: "An advocate represents you in legal proceedings and gives legal advice. A mediator is a neutral third party who helps two or more parties resolve a dispute through negotiation — often faster and cheaper than going to court.",
      },
      {
        q: "Can I message an advocate or mediator directly?",
        a: "Yes, once you have an active consultation request with them. This keeps communication secure and on-platform.",
      },
    ],
  },
  {
    category: "Documents & Cases",
    icon: FileText,
    items: [
      {
        q: "Can I upload documents?",
        a: "Yes. During a consultation, you can share documents securely with your advocate or mediator. All documents are encrypted and only visible to the parties involved.",
      },
      {
        q: "Can Katiba AI summarise a contract for me?",
        a: "Yes. The AI can summarise legal contracts and highlight key clauses. This is a general summary, not legal advice — always have important contracts reviewed by an advocate.",
      },
      {
        q: "Are my conversations confidential?",
        a: "Yes. Your conversations with advocates and mediators are private and encrypted. AI conversations are used only to improve the service, and you can request deletion of your data at any time.",
      },
    ],
  },
  {
    category: "Privacy & Security",
    icon: ShieldCheck,
    items: [
      {
        q: "How is my personal data protected?",
        a: "Katiba AI complies with the Kenya Data Protection Act, 2019. Your data is encrypted, never sold to third parties, and only used to provide the service.",
      },
      {
        q: "Can I delete my account?",
        a: "Yes. You can request account deletion from your profile settings. Your data will be permanently removed within 30 days, except where we're legally required to retain it.",
      },
      {
        q: "Do you share my information with advocates?",
        a: "Only what you choose to share. When you send a consultation request, the advocate sees your name, the message you write, and any documents you upload. Nothing else.",
      },
    ],
  },
  {
    category: "Legal & Compliance",
    icon: Scale,
    items: [
      {
        q: "Is Katiba AI a law firm?",
        a: "No. Katiba AI is a technology platform that provides legal information and connects users with independent advocates and mediators. We do not practise law or provide legal representation.",
      },
      {
        q: "Who owns the legal content on Katiba AI?",
        a: "The official text of the Constitution and laws belongs to the people of Kenya. Our explanations, translations, and AI-generated summaries are ours, but the law itself is always freely accessible.",
      },
      {
        q: "What if the AI gives wrong information?",
        a: "Every AI answer includes a feedback option. Please flag incorrect answers — we review them and use the feedback to improve the system. For any matter with real consequences, always confirm with a qualified advocate.",
      },
    ],
  },
];

// ============================================================
// COMPONENTS
// ============================================================
function FAQItem({ item, isOpen, onToggle }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden bg-white dark:bg-gray-900">
      <button
        type="button"
        onClick={onToggle}
        className="w-full flex items-start justify-between gap-4 px-4 py-3.5 text-left hover:bg-gray-50 dark:hover:bg-gray-800/50 transition"
      >
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {item.q}
        </span>
        <ChevronDown
          className={`w-4 h-4 shrink-0 mt-0.5 text-gray-400 transition-transform ${
            isOpen ? "rotate-180" : ""
          }`}
        />
      </button>
      {isOpen && (
        <div className="px-4 pb-4 -mt-1">
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
            {item.a}
          </p>
        </div>
      )}
    </div>
  );
}

function CategorySection({ category, items }) {
  const [openIndex, setOpenIndex] = useState(null);
  const Icon = category.icon;

  return (
    <section className="mb-10">
      <div className="flex items-center gap-2 mb-4">
        <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center">
          <Icon className="w-4 h-4 text-emerald-700 dark:text-emerald-400" />
        </div>
        <h2 className="text-base font-bold text-gray-900 dark:text-gray-100">
          {category.category}
        </h2>
      </div>

      <div className="flex flex-col gap-2">
        {items.map((item, i) => (
          <FAQItem
            key={i}
            item={item}
            isOpen={openIndex === i}
            onToggle={() => setOpenIndex(openIndex === i ? null : i)}
          />
        ))}
      </div>
    </section>
  );
}

// ============================================================
// PAGE
// ============================================================
export default function FAQ() {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return FAQ_DATA;

    return FAQ_DATA.map((cat) => ({
      ...cat,
      items: cat.items.filter(
        (item) =>
          item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q)
      ),
    })).filter((cat) => cat.items.length > 0);
  }, [query]);

  const totalResults = filtered.reduce((sum, cat) => sum + cat.items.length, 0);

  return (
    <main className="max-w-3xl mx-auto px-4 py-10">
      {/* Header */}
      <div className="text-center mb-8">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-2xl bg-emerald-800 mb-4">
          <HelpCircle className="w-6 h-6 text-amber-400" strokeWidth={2.5} />
        </div>
        <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
          Frequently Asked Questions
        </h1>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-md mx-auto">
          Everything you need to know about Katiba AI, Kenyan law, and how to
          find help.
        </p>
      </div>

      {/* Search */}
      <div className="relative mb-10">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search questions…"
          className="w-full pl-11 pr-4 py-3 rounded-full border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-gray-100 outline-none focus:ring-2 focus:ring-emerald-600"
        />
        {query && (
          <p className="absolute right-4 top-1/2 -translate-y-1/2 text-xs text-gray-400">
            {totalResults} {totalResults === 1 ? "result" : "results"}
          </p>
        )}
      </div>

      {/* Content */}
      {filtered.length === 0 ? (
        <div className="text-center py-16 text-gray-400">
          <Search className="w-8 h-8 mx-auto mb-3 opacity-50" />
          <p className="text-sm">
            No questions match &ldquo;{query}&rdquo;.
          </p>
          <button
            onClick={() => setQuery("")}
            className="mt-3 text-sm text-emerald-700 dark:text-emerald-400 font-medium"
          >
            Clear search
          </button>
        </div>
      ) : (
        filtered.map((cat) => (
          <CategorySection key={cat.category} category={cat} items={cat.items} />
        ))
      )}

      {/* Still have questions CTA */}
      <div className="mt-12 rounded-2xl border border-gray-200 dark:border-gray-800 bg-gradient-to-br from-emerald-50 to-white dark:from-emerald-950/40 dark:to-gray-900 p-6 text-center">
        <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl bg-emerald-800 mb-3">
          <Mail className="w-5 h-5 text-amber-400" />
        </div>
        <h3 className="text-base font-bold text-gray-900 dark:text-gray-100 mb-1">
          Still have a question?
        </h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-sm mx-auto">
          Can't find what you're looking for? Ask the AI or reach out to a
          verified advocate directly.
        </p>
        <div className="flex flex-wrap gap-2 justify-center">
          <Link
            to="/ask"
            className="inline-flex items-center gap-1.5 rounded-full bg-emerald-800 text-white px-5 py-2 text-sm font-medium hover:bg-emerald-900"
          >
            <MessageCircle className="w-4 h-4" />
            Ask Katiba AI
          </Link>
          <Link
            to="/lawyers"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <Gavel className="w-4 h-4" />
            Find an Advocate
          </Link>
          <Link
            to="/mediators"
            className="inline-flex items-center gap-1.5 rounded-full border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 px-5 py-2 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-800/50"
          >
            <Handshake className="w-4 h-4" />
            Find a Mediator
          </Link>
        </div>
      </div>
    </main>
  );
}