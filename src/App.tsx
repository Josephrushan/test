import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { 
  Smartphone,
  Bell,
  Zap,
  Info,
  Apple as AppleIcon,
  Check, 
  ChevronRight, 
  ChevronLeft, 
  Send, 
  GraduationCap, 
  Clock, 
  AlertCircle,
  Trophy,
  Mail,
  Sparkles,
  X
} from "lucide-react";
import { useForm } from "react-hook-form";
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";
import { GoogleGenAI, Type } from "@google/genai";

// --- Utilities ---
function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

// --- Types ---
interface Question {
  id: number;
  text: string;
  options: string[];
  correctAnswer: number; // Index of the correct option
}

// --- Initial Questions (Placeholder) ---
const DEFAULT_QUESTIONS: Question[] = [
  {
    id: 1,
    text: "What are the four intuitive sections of the Educater platform?",
    options: ["Admin, Finance, Sports, Arts", "Communication, Academic, School Life, Personal", "Inbox, Homework, Journal, Settings", "Teachers, Parents, Students, Principal"],
    correctAnswer: 1
  },
  {
    id: 2,
    text: "How does the Communication Section help teachers?",
    options: ["It gives them more WhatsApp groups", "It restores professional boundaries and gives weekends back", "It automates grading", "It provides free mobile data"],
    correctAnswer: 1
  },
  {
    id: 3,
    text: "What is the purpose of the Tutoring Library in the Academic Section?",
    options: ["To play video games", "To search the 'wild west' of the internet", "A searchable hub of institution-approved videos and PDFs", "To chat with other students"],
    correctAnswer: 2
  },
  {
    id: 4,
    text: "Why are comments disabled in the School Life Section's Living Journal?",
    options: ["To save server space", "To eliminate social media risks and bullying", "Because teachers are too busy to moderate", "To encourage more 'likes'"],
    correctAnswer: 1
  },
  {
    id: 5,
    text: "What is the 'Automated Yearbook'?",
    options: ["A physical book students must buy", "A PDF export of the most-loved moments at the end of the year", "A list of student grades", "A collection of teacher profiles"],
    correctAnswer: 1
  },
  {
    id: 6,
    text: "How much does a school employee pay for the Educater infrastructure?",
    options: ["R50 per month", "R100 per month", "It is Free", "R500 once-off"],
    correctAnswer: 2
  },
  {
    id: 7,
    text: "How much does a parent pay per month for the Educater service?",
    options: ["R20 per month", "R50 per month", "R100 per month", "It is free for everyone"],
    correctAnswer: 1
  },
  {
    id: 8,
    text: "What does the R50 monthly parent contribution secure?",
    options: ["One instance of the app for the parent", "Two dedicated instances: one for parent and one for student", "A 10-inch tablet", "Unlimited tutoring"],
    correctAnswer: 1
  },
  {
    id: 9,
    text: "What device is provided to the Principal as a Strategic Oversight Hub?",
    options: ["A smartphone", "A laptop", "A 10-inch Command Tablet", "A desktop computer"],
    correctAnswer: 2
  },
  {
    id: 10,
    text: "How do you install the school portal on an iPhone or iPad?",
    options: ["Download from App Store", "Safari > Share > Add to Home Screen", "Open Settings > Install", "Use Google Chrome"],
    correctAnswer: 1
  },
  {
    id: 11,
    text: "What is a major benefit of using the PWA version of Educater?",
    options: ["It requires a heavy download", "It uses virtually zero storage space", "It only works on desktop", "It needs manual updates"],
    correctAnswer: 1
  },
  {
    id: 12,
    text: "What must you do during your first login to receive homework updates and alerts?",
    options: ["Restart your phone", "Allow notifications when prompted", "Change your password", "Call the school office"],
    correctAnswer: 1
  },
  {
    id: 13,
    text: "How do you install the school portal on an Android device?",
    options: ["Chrome > Three dots > Install app", "Download an APK file", "Use the Apple App Store", "It's pre-installed on all phones"],
    correctAnswer: 0
  },
  {
    id: 14,
    text: "How does Educater support families with financial need?",
    options: ["They get a discount", "They provide full, free access", "They are not allowed to use the app", "They must pay later"],
    correctAnswer: 1
  },
  {
    id: 15,
    text: "Which popular messaging app does Educater replace for school-related communication?",
    options: ["Telegram", "WhatsApp", "Signal", "Facebook Messenger"],
    correctAnswer: 1
  },
  {
    id: 16,
    text: "How quickly can teachers distribute assignments and attachments using Educater?",
    options: ["Hours", "Days", "Seconds", "Minutes"],
    correctAnswer: 2
  },
  {
    id: 17,
    text: "What does the Principal's 10-inch Command Tablet serve as?",
    options: ["A gaming device", "A Strategic Oversight Hub", "A replacement for a phone", "A digital photo frame"],
    correctAnswer: 1
  },
  {
    id: 18,
    text: "Why is the Educater PWA considered 'Always Updated'?",
    options: ["It refreshes every time you open it", "You must download a new version monthly", "The school office sends a link", "It updates during the night"],
    correctAnswer: 0
  },
  {
    id: 19,
    text: "What is the primary focus of the 'Personal Section' in Educater?",
    options: ["Public profiles", "Marketing", "Privacy and security of user data", "Social networking"],
    correctAnswer: 2
  },
  {
    id: 20,
    text: "In the School Life Section, what action can students take on posts to build belonging?",
    options: ["Comment", "Share", "Like", "Delete"],
    correctAnswer: 2
  }
];

export default function App() {
  const [step, setStep] = useState<"welcome" | "registration" | "test" | "result">("welcome");
  const [questions, setQuestions] = useState<Question[]>(DEFAULT_QUESTIONS);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<number, number>>({});
  const [isFinished, setIsFinished] = useState(false);
  const [showBuilder, setShowBuilder] = useState(false);
  const [builderText, setBuilderText] = useState(`Educater: Your School, Simplified.
Educater is the bridge between the classroom and a student’s success, designed for effortless integration at zero cost to your school. We’ve organized the platform into four intuitive sections that transform school management into a high-performance culture.

The Communication Section: Restoring Professional Boundaries
We give your teachers their weekends back. By moving school-related chats off WhatsApp and into a professional, dedicated Inbox, we eliminate the "always-on" pressure. It’s the end of paper-heavy, disorganized administration and the beginning of clear, streamlined dialogue.

The Academic Section: Driving Success 24/7
Effortless Homework: Teachers distribute assignments and attachments in seconds. Parents see a clear, grade-specific feed of exactly what their child needs to accomplish.
The Tutoring Library: Students have a searchable hub of institution-approved videos and PDFs at their fingertips.

The School Life Section: Building Your Digital Heritage
The Living Journal: Teachers post daily "classroom wins" to a private, secure feed.
Safe Engagement: Students "like" posts to build a sense of belonging, but we have disabled comments to eliminate social media risks and bullying.
The Automated Yearbook: At the end of the year, the system exports the most-loved moments into a high-quality, print-ready PDF.

The Personal Section: Complete Security
Privacy is our priority. This protected space houses all user profiles and privacy settings, ensuring that data for Parents, Students, and Teachers remains safe and secure.

Cost & Support:
Zero cost to your school and faculty.
For parents: R50 per month secures two dedicated instances (parent and student).
Financial Need: Full, free access to any family that can demonstrate financial need.
Principal Support: 10-inch Command Tablet provided as a Strategic Oversight Hub.

How to Install:
For Apple (iPhone & iPad): Open Safari > Share button > "Add to Home Screen" > "Add".
For Android: Open Chrome > Three dots (menu) > "Install app" or "Add to Home screen".
For Huawei (Quick App): Open AppGallery > Search Educater > Open > Four dots (menu) > "Add to Home Screen".
Vital Step: Enable Notifications during first login.`);
  const [isGenerating, setIsGenerating] = useState(false);
  
  // User Info
  const [userInfo, setUserInfo] = useState({ name: "", email: "" });

  const currentQuestion = questions[currentQuestionIndex];
  const progress = questions.length > 0 ? ((currentQuestionIndex + 1) / questions.length) * 100 : 0;

  const handleStart = () => {
    setStep("registration");
  };

  const handleBeginTest = (data: { name: string; email: string }) => {
    setUserInfo(data);
    setStep("test");
  };

  const handleAnswer = (optionIndex: number) => {
    setAnswers((prev) => ({
      ...prev,
      [currentQuestion.id]: optionIndex,
    }));
  };

  const handleNext = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex((prev) => prev + 1);
    } else {
      handleFinish();
    }
  };

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((prev) => prev - 1);
    }
  };

  const calculateScore = () => {
    let score = 0;
    questions.forEach((q) => {
      if (answers[q.id] === q.correctAnswer) {
        score++;
      }
    });
    return score;
  };

  const handleFinish = () => {
    setIsFinished(true);
    setStep("result");
  };

  // --- Gemini Generation ---
  const generateQuestions = async () => {
    if (!builderText.trim()) return;
    setIsGenerating(true);
    try {
      const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY! });
      const response = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: `Generate 8-10 multiple choice questions based on this information about a company called Educater: "${builderText}". 
        Return the result as a JSON array of objects with fields: id (number), text (string), options (array of 4 strings), correctAnswer (index 0-3).`,
        config: {
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                id: { type: Type.NUMBER },
                text: { type: Type.STRING },
                options: { type: Type.ARRAY, items: { type: Type.STRING } },
                correctAnswer: { type: Type.NUMBER }
              },
              required: ["id", "text", "options", "correctAnswer"]
            }
          }
        }
      });

      const newQuestions = JSON.parse(response.text);
      setQuestions(newQuestions);
      setShowBuilder(false);
      setAnswers({});
      setCurrentQuestionIndex(0);
      alert("Questions generated successfully!");
    } catch (error) {
      console.error(error);
      alert("Failed to generate questions. Please try again.");
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Formspree Submission ---
  const { register, handleSubmit, formState: { isSubmitting, isSubmitSuccessful } } = useForm();

  const onSendEmail = async () => {
    const score = calculateScore();
    const resultData = {
      name: userInfo.name,
      email: userInfo.email,
      score: `${score} / ${questions.length}`,
      percentage: `${Math.round((score / questions.length) * 100)}%`,
      testName: "Educater Online Assessment",
      submissionDate: new Date().toLocaleString()
    };

    try {
      const response = await fetch("https://formspree.io/f/myknkdja", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(resultData),
      });
      if (!response.ok) throw new Error("Failed to send");
    } catch (error) {
      console.error(error);
      alert("Submission failed. Please try again later.");
    }
  };

  const LOGO_URL = "https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/Educatorwhite.png?alt=media&token=c19f45df-b3d6-41a1-be5f-7432b9bba889";

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans selection:bg-brand/20">
      {/* Builder Modal */}
      <AnimatePresence>
        {showBuilder && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm"
          >
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-8 w-full max-w-2xl shadow-2xl border border-slate-100"
            >
              <div className="flex items-center justify-between mb-6">
                <div className="flex items-center gap-2">
                  <Sparkles className="text-brand w-6 h-6" />
                  <h2 className="text-2xl font-bold text-slate-900">Test Builder</h2>
                </div>
                <button onClick={() => setShowBuilder(false)} className="p-2 hover:bg-slate-100 rounded-full transition-colors">
                  <X className="w-6 h-6 text-slate-400" />
                </button>
              </div>
              
              <p className="text-slate-500 mb-4 text-sm">
                Paste information about Educater below. AI will generate 8-10 questions for the test.
              </p>
              
              <textarea
                value={builderText}
                onChange={(e) => setBuilderText(e.target.value)}
                placeholder="Educater is a leading EdTech company founded in 2018..."
                className="w-full h-48 p-4 rounded-3xl bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all resize-none mb-6"
              />
              
              <button
                onClick={generateQuestions}
                disabled={isGenerating || !builderText.trim()}
                className="w-full flex items-center justify-center gap-2 px-8 py-4 bg-brand text-slate-900 rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-brand/20"
              >
                {isGenerating ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Generating Questions...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-5 h-5" />
                    Generate Test
                  </>
                )}
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <main className="max-w-3xl mx-auto px-4 py-6 md:py-16">
        <AnimatePresence mode="wait">
          {step === "welcome" && (
            <motion.div
              key="welcome"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-brand/5 border border-brand/10 text-center relative"
            >
              <div className="mb-2 flex justify-center">
                <img 
                  src={LOGO_URL} 
                  alt="Educater Logo" 
                  className="h-10 md:h-14 object-contain brightness-0"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <div className="mb-3 flex justify-center">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/trial.jpg?alt=media&token=45b4ccd6-5254-413c-bcb3-fee99ec3816c" 
                  alt="Trial" 
                  className="max-w-[200px] w-full h-auto rounded-3xl"
                  referrerPolicy="no-referrer"
                />
              </div>
              
              <h1 className="text-3xl md:text-4xl font-semibold tracking-tight mb-4 text-slate-900">
                Online Assessment
              </h1>
              <p className="text-base md:text-lg text-slate-500 mb-8 md:mb-10 max-w-md mx-auto leading-relaxed">
                Welcome to the official Educater online test. This assessment evaluates your knowledge of our mission, technology, and core values.
              </p>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-10 text-left">
                <div className="flex items-center gap-3 p-4 rounded-full bg-slate-50 border border-slate-100">
                  <GraduationCap className="text-brand w-5 h-5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Topic</p>
                    <p className="font-medium text-slate-700">Company Knowledge</p>
                  </div>
                </div>
                <div className="flex items-center gap-3 p-4 rounded-full bg-slate-50 border border-slate-100">
                  <AlertCircle className="text-brand w-5 h-5" />
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Questions</p>
                    <p className="font-medium text-slate-700">{questions.length} Multiple Choice</p>
                  </div>
                </div>
              </div>

              <button
                onClick={handleStart}
                className="group relative inline-flex items-center justify-center px-8 py-3.5 md:px-10 md:py-4 font-bold text-slate-900 transition-all duration-200 bg-brand rounded-full focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-brand hover:opacity-90 w-full md:w-auto shadow-lg shadow-brand/20"
              >
                Get Started
                <ChevronRight className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </button>
            </motion.div>
          )}

          {step === "registration" && (
            <motion.div
              key="registration"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-brand/5 border border-brand/10"
            >
              <div className="mb-8 text-center">
                <h2 className="text-2xl md:text-3xl font-semibold mb-2 text-slate-900">Registration</h2>
                <p className="text-slate-500">Please provide your details to begin the assessment.</p>
              </div>

              <form 
                onSubmit={(e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  handleBeginTest({
                    name: formData.get("name") as string,
                    email: formData.get("email") as string,
                  });
                }}
                className="space-y-6 max-w-md mx-auto"
              >
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Full Name</label>
                  <input
                    name="name"
                    required
                    placeholder="Enter your full name"
                    className="w-full px-6 py-4 rounded-full bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-semibold text-slate-600 ml-1">Email Address</label>
                  <input
                    name="email"
                    type="email"
                    required
                    placeholder="Enter your email"
                    className="w-full px-6 py-4 rounded-full bg-slate-50 border border-slate-200 text-slate-900 focus:ring-2 focus:ring-brand outline-none transition-all"
                  />
                </div>
                <button
                  type="submit"
                  className="w-full py-3.5 md:py-4 bg-brand text-slate-900 rounded-full font-bold hover:opacity-90 transition-all shadow-lg shadow-brand/20 mt-4"
                >
                  Begin Assessment
                </button>
              </form>
            </motion.div>
          )}

          {step === "test" && questions.length > 0 && (
            <motion.div
              key="test"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              className="space-y-8"
            >
              <div className="flex items-center justify-between bg-white p-4 rounded-3xl border border-slate-100 shadow-sm">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-slate-900 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{currentQuestionIndex + 1}</span>
                  </div>
                  <div>
                    <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Question</p>
                    <p className="font-medium text-slate-900">of {questions.length}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-xs font-semibold text-slate-400 uppercase tracking-widest">Candidate</p>
                  <p className="font-medium text-slate-700 truncate max-w-[150px]">{userInfo.name}</p>
                </div>
              </div>

              <div className="w-full bg-slate-200 h-2 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${progress}%` }}
                  className="h-full bg-brand"
                />
              </div>

              <div className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-brand/5 border border-brand/10">
                <h2 className="text-xl md:text-2xl font-semibold text-slate-900 mb-6 md:mb-8 leading-tight">
                  {currentQuestion.text}
                </h2>

                <div className="space-y-4">
                  {currentQuestion.options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(idx)}
                      className={cn(
                        "w-full text-left p-4 rounded-2xl border-2 transition-all duration-200 flex items-center justify-between group",
                        answers[currentQuestion.id] === idx
                          ? "border-brand bg-brand/10 text-slate-900"
                          : "border-slate-100 hover:border-brand/30 hover:bg-slate-50 text-slate-600"
                      )}
                    >
                      <span className="font-medium">{option}</span>
                      <div className={cn(
                        "w-6 h-6 rounded-lg border-2 flex items-center justify-center transition-colors",
                        answers[currentQuestion.id] === idx
                          ? "border-brand bg-brand text-slate-900"
                          : "border-slate-200 group-hover:border-brand/40"
                      )}>
                        {answers[currentQuestion.id] === idx && <Check className="w-4 h-4" />}
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={handlePrev}
                  disabled={currentQuestionIndex === 0}
                  className="flex items-center gap-2 px-8 py-3 rounded-full font-semibold text-slate-400 hover:text-brand hover:bg-brand/5 disabled:opacity-30 disabled:hover:bg-transparent transition-all"
                >
                  <ChevronLeft className="w-5 h-5" />
                  Previous
                </button>
                <button
                  onClick={handleNext}
                  disabled={answers[currentQuestion.id] === undefined}
                  className="flex items-center gap-2 px-4 md:px-6 py-2 bg-brand text-slate-900 rounded-full font-bold hover:opacity-90 disabled:opacity-50 disabled:hover:bg-brand transition-all shadow-lg shadow-brand/20"
                >
                  {currentQuestionIndex === questions.length - 1 ? "Finish" : "Next"}
                  <ChevronRight className="w-5 h-5" />
                </button>
              </div>
            </motion.div>
          )}

          {step === "result" && (
            <motion.div
              key="result"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="bg-white rounded-3xl p-6 md:p-10 shadow-xl shadow-brand/5 border border-brand/10 text-center"
            >
              <div className="mx-auto mb-8 flex justify-center">
                <img 
                  src="https://firebasestorage.googleapis.com/v0/b/websitey-9f8e4.firebasestorage.app/o/trophy.png?alt=media&token=c550b70e-4419-4e07-aeb1-9a112a219c32" 
                  alt="Trophy" 
                  className="w-24 h-24 object-contain"
                  referrerPolicy="no-referrer"
                />
              </div>
              <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 mb-2">Assessment Complete!</h2>
              <p className="text-slate-500 mb-8">Great job, {userInfo.name}! You've finished the test.</p>

              <div className="rounded-3xl p-6 md:p-8 mb-8 md:mb-10 inline-block min-w-[240px]">
                <p className="text-brand text-sm font-bold uppercase tracking-widest mb-1">Your Score</p>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-6xl font-bold text-slate-900">{calculateScore()}</span>
                  <span className="text-2xl font-bold text-slate-500">/ {questions.length}</span>
                </div>
                <p className="text-slate-600 font-medium mt-2">
                  {Math.round((calculateScore() / questions.length) * 100)}% Accuracy
                </p>
              </div>

              <div className="max-w-md mx-auto">
                <div className="h-px bg-slate-100 w-full mb-10" />
                <h3 className="text-lg font-bold text-slate-900 mb-4 flex items-center justify-center gap-2">
                  <Mail className="w-5 h-5 text-brand" />
                  Finalize Submission
                </h3>
                
                {isSubmitSuccessful ? (
                  <motion.div 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-4 bg-emerald-50 text-emerald-700 rounded-3xl border border-emerald-100 font-medium"
                  >
                    Results sent successfully!
                  </motion.div>
                ) : (
                  <div className="space-y-4">
                    <p className="text-xs text-slate-400 mt-2 leading-tight px-2">
                      Click below to send your results to the administrator.
                    </p>
                    <button
                      onClick={() => handleSubmit(onSendEmail)()}
                      disabled={isSubmitting}
                      className="w-full flex items-center justify-center gap-2 px-8 md:px-10 py-3.5 md:py-4 bg-slate-900 text-white rounded-full font-bold hover:opacity-90 disabled:opacity-50 transition-all shadow-lg shadow-slate-900/20"
                    >
                      {isSubmitting ? "Sending..." : "Submit Results"}
                      <Send className="w-4 h-4" />
                    </button>
                  </div>
                )}
              </div>

              <button
                onClick={() => window.location.reload()}
                className="mt-12 text-slate-400 hover:text-brand font-semibold transition-colors"
              >
                Retake Assessment
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
