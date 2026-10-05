import React from "react";
import { Routes, Route } from "react-router-dom";
import Layout from "./components/Layout.jsx";
import AdvocateLayout from "./components/AdvocateLayout.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Home from "./pages/Home.jsx";
import Chat from "./pages/Chat.jsx";
import Answer from "./pages/Answer.jsx";
import Constitution from "./pages/Constitution.jsx";
import Laws from "./pages/Laws.jsx";
import CaseLaw from "./pages/CaseLaw.jsx";
import Topics from "./pages/Topics.jsx";
import About from "./pages/About.jsx";
import ArticleDetail from "./pages/ArticleDetail.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import AdvocateDashboard from "./pages/AdvocateDashboard.jsx";
import Lawyers from "./pages/Lawyers.jsx";
import LawyerRequests from "./pages/LawyerRequests.jsx";
import Clients from "./pages/Clients.jsx";
import AdvocateCalendar from "./pages/Calendar.jsx";
import Cases from "./pages/Cases.jsx";
import CaseDetail from "./pages/CaseDetail.jsx";
import Messages from "./pages/Messages.jsx";
import Documents from "./pages/Documents.jsx";
import Reviews from "./pages/Reviews.jsx";
import Analytics from "./pages/Analytics.jsx";
import MyRequests from "./pages/MyRequests.jsx";
import Settings from "./pages/Settings.jsx";
import Profile from "./pages/Profile.jsx";
import AdvocateProfile from "./pages/AdvocateProfile.jsx";
import Placeholder from "./pages/Placeholder.jsx";
import FAQ from "./pages/FAQ";
import SavedAnswers from "./pages/SavedAnswers";


export default function App() {
  return (
    <Routes>
      {/* Auth pages - standalone, no sidebar/topbar, since you're not "in" the app yet */}
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/faq" element={<FAQ />} />

      {/* Citizen-facing app - shared Layout (Sidebar + Topbar) */}
      <Route element={<Layout />}>
        {/* / - default - User Dashboard (overview & quick-ask) */}
        <Route path="/" element={<Home />} />

        {/* /ask - AI Chat - persistent multi-turn conversation with Katiba AI */}
        <Route path="/ask" element={<Chat />} />

        {/* one-off answer view, reached from Home's quick-ask or Topbar search */}
        <Route path="/answer" element={<Answer />} />

        {/* /constitution - Constitution browser */}
        <Route path="/constitution" element={<Constitution />} />
        {/* /constitution/4/27 - Article 27 page */}
        <Route path="/constitution/:chapterNumber/:articleNumber" element={<ArticleDetail />} />

        {/* /laws - Acts & Statutes */}
        <Route path="/laws" element={<Laws />} />
        {/* Generic article/section route for any non-Constitution law, e.g. Penal Code sections */}
        <Route path="/law/:chapterNumber/:articleNumber" element={<ArticleDetail />} />

        {/* /case-law - Judgments */}
        <Route path="/case-law" element={<CaseLaw />} />

        {/* /topics - Legal Topics A-Z, cutting across every law source */}
        <Route path="/topics" element={<Topics />} />

        {/* /lawyers - Verified advocates directory */}
        <Route path="/lawyers" element={<Lawyers />} />
        <Route path="/lawyers/:id" element={<AdvocateProfile />} />
        <Route path="/saved" element={<SavedAnswers />} />

        {/* /messages - citizen side of the same Messages component the advocate uses */}
        <Route
          path="/messages"
          element={
            <ProtectedRoute>
              <Messages />
            </ProtectedRoute>
          }
        />

        {/* /requests - citizen's sent consultation requests: reschedule confirm/decline, cancel, review */}
        <Route
          path="/requests"
          element={
            <ProtectedRoute>
              <MyRequests />
            </ProtectedRoute>
          }
        />

        {/* /settings - citizen side of the same Settings component the advocate uses */}
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />

        <Route path="/saved" element={<SavedAnswers />} />
        <Route path="/about" element={<About />} />
        <Route
          path="/faq"
          element={<Placeholder title="Frequently Asked Questions" description="Common questions - coming next." />}
        />
      </Route>

      {/* Advocate portal - its own layout (different sidebar/topbar), protected + role-gated */}
      <Route
        element={
          <ProtectedRoute role="advocate">
            <AdvocateLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/lawyer/dashboard" element={<AdvocateDashboard />} />
        <Route path="/lawyer/requests" element={<LawyerRequests />} />
        <Route path="/lawyer/clients" element={<Clients />} />
        <Route path="/lawyer/calendar" element={<AdvocateCalendar />} />
        <Route path="/lawyer/cases" element={<Cases />} />
        <Route path="/lawyer/cases/:id" element={<CaseDetail />} />
        <Route path="/lawyer/messages" element={<Messages />} />
        <Route path="/lawyer/documents" element={<Documents />} />
        <Route path="/lawyer/reviews" element={<Reviews />} />
        <Route path="/lawyer/analytics" element={<Analytics />} />
        <Route
          path="/lawyer/earnings"
          element={<Placeholder title="Earnings" description="Earnings tracking isn't built yet." />}
        />
        <Route path="/lawyer/profile" element={<Profile />} />
        <Route path="/lawyer/settings" element={<Settings />} />
      </Route>

      <Route path="*" element={<Placeholder title="Not found" description="That page doesn't exist." />} />
    </Routes>
  );
}