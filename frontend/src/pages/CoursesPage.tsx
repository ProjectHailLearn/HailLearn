import React, { useEffect, useState } from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { useNavigate } from 'react-router-dom';
import { courseService } from '../services/courseService';
import { Course } from '../types';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();
  const [courses, setCourses] = useState<Course[] | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [view, setView] = useState<'ALL' | 'ENROLLED'>('ALL');

  useEffect(() => {
    courseService.getAll().then(setCourses).catch(() => setError('Failed to load courses'));
  }, []);

  const handleEnroll = async (course: Course) => {
    try {
      const isEnrolled = await courseService.toggleEnroll(course.id);
      setCourses((prev) =>
        prev?.map((c) =>
          c.id === course.id
            ? { ...c, isEnrolled, enrolledStudents: c.enrolledStudents + (isEnrolled ? 1 : -1) }
            : c
        ) ?? null
      );
    } catch {
      setError('Failed to update enrollment');
    }
  };

  const visible = (courses || []).filter((c) => view === 'ALL' || c.isEnrolled);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-white tracking-tight flex items-center gap-2.5">
            <GraduationCap className="w-6 h-6 text-brand-400" />
            University Courses & Syllabus Tracker
          </h1>
          <p className="text-xs text-slate-400">
            Active semester courses, syllabus mastery metrics, and unresolved doubt triage per course
          </p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {(['ALL', 'ENROLLED'] as const).map((v) => (
          <button
            key={v}
            onClick={() => setView(v)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${
              view === v
                ? 'bg-brand-600/20 border-brand-500/40 text-brand-300'
                : 'bg-slate-950/60 border-slate-800 text-slate-400 hover:text-slate-200'
            }`}
          >
            {v === 'ALL' ? 'All Courses' : 'My Courses'}
          </button>
        ))}
      </div>

      {error && <div className="text-xs text-rose-400">{error}</div>}
      {courses === null && !error && <div className="text-xs text-slate-500">Loading courses…</div>}
      {courses !== null && visible.length === 0 && (
        <div className="text-xs text-slate-500">You haven't enrolled in any courses yet.</div>
      )}

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {visible.map((course) => (
          <Card
            key={course.id}
            variant="glass"
            className="p-6 space-y-4 hover:border-brand-500/30 transition-all duration-300 group"
          >
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="flex items-center gap-2 mb-1.5">
                  <span className="font-mono text-xs font-bold text-brand-400 bg-brand-500/10 px-2.5 py-0.5 rounded-lg border border-brand-500/20">
                    {course.code}
                  </span>
                  <span className="text-xs text-slate-400">• {course.credits} Credits</span>
                </div>
                <h3 className="text-base font-bold text-white group-hover:text-brand-300 transition">
                  {course.title}
                </h3>
                <div className="text-xs text-slate-400 mt-0.5">Instructor: {course.instructor}</div>
              </div>

              <div className="text-right">
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2 py-1 rounded-lg border border-amber-500/20">
                  {course.activeDoubts} Open Doubts
                </span>
              </div>
            </div>

            {/* Progress / Syllabus */}
            <div className="space-y-2 pt-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">Syllabus Covered</span>
                <span className="font-mono font-bold text-brand-400">{course.syllabusCovered}%</span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-brand-600 to-indigo-600 rounded-full"
                  style={{ width: `${course.syllabusCovered}%` }}
                />
              </div>
            </div>

            {/* Personal progress */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-300 font-medium">My Doubts Resolved</span>
                <span className="font-mono font-bold text-emerald-400">
                  {course.myResolved}/{course.myDoubts}
                </span>
              </div>
              <div className="w-full bg-slate-950 rounded-full h-2 overflow-hidden border border-slate-800">
                <div
                  className="h-full bg-gradient-to-r from-emerald-600 to-teal-500 rounded-full"
                  style={{ width: `${course.progress}%` }}
                />
              </div>
            </div>

            {/* Lecture Schedule */}
            <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800 text-xs text-slate-300 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Calendar className="w-4 h-4 text-brand-400 flex-shrink-0" />
                <span className="truncate">Next: {course.nextLecture}</span>
              </div>
              <span className="text-slate-400 flex items-center gap-1 flex-shrink-0">
                <Users className="w-3.5 h-3.5" />
                {course.enrolledStudents}
              </span>
            </div>

            {/* Actions */}
            <div className="pt-2 grid grid-cols-3 gap-2">
              <Button
                variant={course.isEnrolled ? 'secondary' : 'gradient'}
                size="sm"
                onClick={() => handleEnroll(course)}
                className="w-full text-xs"
              >
                {course.isEnrolled ? 'Unenroll' : 'Enroll'}
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/doubts?course=${course.code}`)}
                className="w-full text-xs"
              >
                Course Doubts
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate(`/knowledge?search=${course.code}`)}
                className="w-full text-xs"
              >
                Course Notes
              </Button>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
