import React from 'react';
import {
  GraduationCap,
  Users,
  Calendar,
} from 'lucide-react';
import { Card } from '../components/common/Card';
import { Button } from '../components/common/Button';
import { MOCK_COURSES } from '../constants/mockData';
import { useNavigate } from 'react-router-dom';

export const CoursesPage: React.FC = () => {
  const navigate = useNavigate();

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

      {/* Courses Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {MOCK_COURSES.map((course) => (
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
            <div className="pt-2 flex items-center justify-between gap-3">
              <Button
                variant="outline"
                size="sm"
                onClick={() => navigate('/doubts')}
                className="w-full text-xs"
              >
                View Course Doubts
              </Button>
              <Button
                variant="gradient"
                size="sm"
                onClick={() => navigate('/knowledge')}
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
