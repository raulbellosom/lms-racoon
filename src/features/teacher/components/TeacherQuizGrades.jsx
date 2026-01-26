import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  QuizService,
  QuizQuestionService,
} from "../../../shared/data/quizzes-teacher"; // Adjust path if needed
import { db, Query } from "../../../shared/appwrite/client"; // Direct DB access for attempts if service missing
import { APPWRITE } from "../../../shared/appwrite/ids";
import { Card } from "../../../shared/ui/Card";
import {
  Trophy,
  Users,
  Clock,
  CheckCircle,
  XCircle,
  ChevronDown,
  ChevronUp,
  HelpCircle,
} from "lucide-react";
import { EmptyState } from "../../../shared/components/EmptyState";

export function TeacherQuizGrades({ courseId }) {
  const { t } = useTranslation();
  const [quizzes, setQuizzes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedQuiz, setExpandedQuiz] = useState(null);
  const [attempts, setAttempts] = useState({}); // quizId -> attempts[]

  useEffect(() => {
    loadQuizzes();
  }, [courseId]);

  const loadQuizzes = async () => {
    setLoading(true);
    try {
      const list = await QuizService.listByCourse(courseId);
      setQuizzes(list);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const loadAttempts = async (quizId) => {
    if (attempts[quizId]) return; // Already loaded

    try {
      // We need a service or query for this.
      // Creating ad-hoc query here or adding to service?
      // Ideally we add `listAttemptsByQuiz` to `quizzes-teacher.js`.
      // For now, I'll use direct DB call here for internal dashboard logic or mock it if restricted.
      // The user asked "if we need to modify db".
      // I'll assume we can query `quizAttempts` by `quizId`.

      const res = await db.listDocuments(
        APPWRITE.databaseId,
        APPWRITE.collections.quizAttempts,
        [
          Query.equal("quizId", quizId),
          Query.orderDesc("startedAt"),
          Query.limit(100),
        ],
      );

      // Enrich with user info? (Ideally backend, but client-side joins for MVP)
      // We need profiles. Let's assume we just show names if available or IDs.

      setAttempts((prev) => ({ ...prev, [quizId]: res.documents }));
    } catch (e) {
      console.error("Failed to load attempts", e);
      // Fallback for demo
      setAttempts((prev) => ({ ...prev, [quizId]: [] })); // For now empty to avoid infinite load state
    }
  };

  const toggleExpand = (quizId) => {
    if (expandedQuiz === quizId) {
      setExpandedQuiz(null);
    } else {
      setExpandedQuiz(quizId);
      loadAttempts(quizId);
    }
  };

  if (loading)
    return <div className="p-8 text-center">{t("common.loading")}</div>;
  if (quizzes.length === 0)
    return (
      <EmptyState
        icon={HelpCircle}
        title={t("teacher.quiz.noQuizzes")}
        description={t("teacher.quiz.createInCurriculum")}
        className="min-h-[60vh] animate-in fade-in zoom-in-95 duration-500"
      />
    );

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="p-4 flex items-center gap-4">
          <div className="p-3 rounded-full bg-purple-100 text-purple-600">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">{quizzes.length}</div>
            <div className="text-sm text-[rgb(var(--text-secondary))]">
              {t("teacher.grades.totalQuizzes")}
            </div>
          </div>
        </Card>
        {/* Placeholder stats */}
        <Card className="p-4 flex items-center gap-4 opacity-50">
          <div className="p-3 rounded-full bg-blue-100 text-blue-600">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <div className="text-2xl font-bold">-</div>
            <div className="text-sm text-[rgb(var(--text-secondary))]">
              {t("teacher.grades.totalAttempts")}
            </div>
          </div>
        </Card>
      </div>

      <div className="space-y-4">
        {quizzes.map((quiz) => {
          const quizAttempts = attempts[quiz.$id] || [];
          const isExpanded = expandedQuiz === quiz.$id;

          return (
            <Card key={quiz.$id} className="overflow-hidden transition-all">
              <div
                className="p-4 flex items-center justify-between cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800"
                onClick={() => toggleExpand(quiz.$id)}
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-purple-50 text-purple-600 rounded">
                    <CheckCircle className="h-5 w-5" />
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg">{quiz.title}</h3>
                    <div className="text-sm text-[rgb(var(--text-secondary))] line-clamp-1">
                      {quiz.description}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="text-right hidden sm:block">
                    <div className="text-xs text-[rgb(var(--text-secondary))]">
                      {t("teacher.quiz.passingScore")}
                    </div>
                    <div className="font-bold">
                      {Math.round(quiz.passingScore * 100)}%
                    </div>
                  </div>
                  <button className="p-2 text-gray-400">
                    {isExpanded ? <ChevronUp /> : <ChevronDown />}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t bg-gray-50 dark:bg-gray-900/50 p-4">
                  <h4 className="font-semibold mb-3 text-sm uppercase tracking-wider text-[rgb(var(--text-secondary))]">
                    {t("teacher.grades.recentAttempts")} ({quizAttempts.length})
                  </h4>

                  {quizAttempts.length === 0 ? (
                    <div className="text-sm text-[rgb(var(--text-muted))]">
                      {t("teacher.grades.noAttempts")}
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm text-left">
                        <thead className="text-[rgb(var(--text-secondary))] border-b">
                          <tr>
                            <th className="pb-2 pl-2">
                              {t("teacher.grades.studentId")}
                            </th>
                            <th className="pb-2">{t("teacher.grades.date")}</th>
                            <th className="pb-2">
                              {t("teacher.grades.score")}
                            </th>
                            <th className="pb-2">
                              {t("teacher.grades.status")}
                            </th>
                          </tr>
                        </thead>
                        <tbody>
                          {quizAttempts.map((att) => (
                            <tr
                              key={att.$id}
                              className="border-b last:border-0 hover:bg-gray-100 dark:hover:bg-gray-800/50"
                            >
                              <td className="py-2 pl-2 font-mono text-xs">
                                {att.userId}
                              </td>
                              <td className="py-2">
                                {new Date(att.startedAt).toLocaleDateString()}
                              </td>
                              <td className="py-2 font-bold">
                                {Math.round(att.score * 100)}%
                              </td>
                              <td className="py-2">
                                {att.passed ? (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-700">
                                    <CheckCircle className="h-3 w-3" />{" "}
                                    {t("teacher.grades.passed")}
                                  </span>
                                ) : (
                                  <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-700">
                                    <XCircle className="h-3 w-3" />{" "}
                                    {t("teacher.grades.failed")}
                                  </span>
                                )}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </Card>
          );
        })}
      </div>
    </div>
  );
}
