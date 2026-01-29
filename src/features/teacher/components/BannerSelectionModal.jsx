import React, { useState, useEffect } from "react";
import { useTranslation } from "react-i18next";
import {
  Upload,
  Video,
  Image as ImageIcon,
  Check,
  PlayCircle,
  LayoutTemplate,
  X,
} from "lucide-react";
import { Modal } from "../../../shared/ui/Modal";
import { FileService } from "../../../shared/data/files";
import { LessonService } from "../../../shared/data/lessons-teacher";
import { DEFAULT_BANNERS } from "../../../shared/assets/banners";
import { useToast } from "../../../app/providers/ToastProvider";
import { LoadingSpinner } from "../../../shared/ui/LoadingScreen";

export function BannerSelectionModal({
  open,
  onOpenChange,
  onSelect,
  courseId,
  currentBannerId,
  currentVideoId,
}) {
  const { t } = useTranslation();
  const { showToast } = useToast();
  const [activeTab, setActiveTab] = useState("upload"); // upload, video, patterns
  const [lessons, setLessons] = useState([]);
  const [loadingLessons, setLoadingLessons] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Fetch lessons when video tab is active
  useEffect(() => {
    if (activeTab === "video" && courseId && lessons.length === 0) {
      loadLessons();
    }
  }, [activeTab, courseId, lessons.length]);

  const loadLessons = async () => {
    setLoadingLessons(true);
    try {
      const allLessons = await LessonService.listByCourse(courseId);
      // Filter lessons that have a video
      const videoLessons = allLessons.filter(
        (l) =>
          (l.videoStatus === "ready" && l.videoHlsUrl) ||
          l.videoProvider === "minio" ||
          l.videoFileId, // Legacy support
      );
      setLessons(videoLessons);
    } catch (error) {
      console.error("Failed to load lessons for video selection", error);
    } finally {
      setLoadingLessons(false);
    }
  };
// ...
// ...
                      className={`
                                    relative cursor-pointer rounded-xl border p-3 transition-all hover:shadow-md
                                    ${
                                      (currentVideoId &&
                                        (currentVideoId === lesson.videoHlsUrl ||
                                          currentVideoId ===
                                            lesson.videoFileId)) ||
                                      (lesson.videoObjectKey &&
                                        currentVideoId ===
                                          lesson.videoObjectKey)
                                        ? "border-[rgb(var(--brand-primary))] bg-[rgb(var(--brand-primary))/0.05]"
                                        : "border-[rgb(var(--border-base))] hover:border-[rgb(var(--brand-primary))/0.5]"
                                    }
                                `}
                      onClick={() => {
                        onSelect({
                          type: "video",
                          value:
                            lesson.videoProvider === "minio"
                              ? lesson.videoObjectKey // Use object key for MinIO reference if needed, or HLS URL?
                              : lesson.videoFileId,
                          provider: lesson.videoProvider || "appwrite",
                          hlsUrl: lesson.videoHlsUrl,
                          coverId: lesson.videoCoverFileId,
                        });
                        onOpenChange(false);
                      }}
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-16 w-24 shrink-0 items-center justify-center rounded-lg bg-black/10">
                          <PlayCircle className="h-8 w-8 text-[rgb(var(--text-muted))]" />
                        </div>
                        <div className="min-w-0 pr-6">
                          <h4 className="line-clamp-2 text-sm font-medium">
                            {lesson.title}
                          </h4>
                          <span className="mt-1 block text-xs text-[rgb(var(--text-secondary))]">
                            {t("common.lesson")}
                          </span>
                        </div>
                        {currentVideoId === lesson.videoFileId && (
                          <div className="absolute right-3 top-3 flex h-5 w-5 items-center justify-center rounded-full bg-[rgb(var(--brand-primary))]">
                            <Check className="h-3 w-3 text-white" />
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </Modal>
  );
}
