'use client';

import React, { useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  User, GraduationCap, Upload, ArrowRight, Loader2, Mail,
  Building, Hash, Award, FileText, CreditCard, CheckCircle, Sparkles
} from 'lucide-react';
import FileUpload from '@/components/contestant/FileUpload';
import { contestantService } from '@/api/contestantService';

export default function RegisterPage() {
  const router = useRouter();
  const searchParams = useSearchParams();

  const email = searchParams.get('email') || '';
  const assessmentId = searchParams.get('assessmentId') || '';

  const [formData, setFormData] = useState({
    fullName: '',
    college: '',
    department: '',
    registrationNumber: '',
    cgpa: '',
    resumeUrl: '',
    idCardUrl: '',
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleResumeUpload = async (file: File) => {
    const res = await contestantService.uploadResume(file);
    setFormData({ ...formData, resumeUrl: res.data.url });
    return res.data.url;
  };

  const handleIdCardUpload = async (file: File) => {
    const res = await contestantService.uploadIdCard(file);
    setFormData({ ...formData, idCardUrl: res.data.url });
    return res.data.url;
  };

  const handleSubmit = async () => {
    if (
      !formData.fullName ||
      !formData.college ||
      !formData.department ||
      !formData.registrationNumber ||
      !formData.cgpa
    ) {
      setError('Please fill all required fields');
      return;
    }

    const cgpaNum = parseFloat(formData.cgpa);
    if (isNaN(cgpaNum) || cgpaNum < 0 || cgpaNum > 10) {
      setError('CGPA must be between 0 and 10');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const payload: any = {
        email,
        fullName: formData.fullName,
        college: formData.college,
        department: formData.department,
        registrationNumber: formData.registrationNumber,
        cgpa: cgpaNum,
        assessmentId,
        invitationId: '',
      };

      if (formData.resumeUrl) payload.resumeUrl = formData.resumeUrl;
      if (formData.idCardUrl) payload.idCardUrl = formData.idCardUrl;

      const response = await contestantService.register(payload);

      contestantService.storeSession(
        response.data.sessionToken,
        response.data.token,
        assessmentId
      );

      router.push(`/contestant/assessment/${assessmentId}`);
    } catch (err: any) {
      setError(err.response?.data?.message || 'Registration failed');
    } finally {
      setLoading(false);
    }
  };

  const completedFields = [
    formData.fullName,
    formData.college,
    formData.department,
    formData.registrationNumber,
    formData.cgpa
  ].filter(Boolean).length;

  const progress = (completedFields / 5) * 100;
  const isFormValid = formData.fullName && formData.college && formData.department && formData.registrationNumber && formData.cgpa;

  return (
    <div className="h-screen w-screen flex items-center justify-center p-4 bg-gradient-to-br from-[#f8f7ff] via-[#f0eeff] to-[#e8e5ff] overflow-hidden">
      {/* Abstract Background Graphics */}
      <div className="absolute inset-0 overflow-hidden">
        {/* Gradient Mesh */}
        <div className="absolute inset-0 opacity-30" style={{
          backgroundImage: `radial-gradient(circle at 20% 50%, rgba(139, 92, 246, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 80% 50%, rgba(99, 102, 241, 0.15) 0%, transparent 50%),
                            radial-gradient(circle at 50% 80%, rgba(168, 85, 247, 0.1) 0%, transparent 40%)`
        }} />

        {/* Floating Orbs */}
        <motion.div
          animate={{ y: [0, -20, 0], x: [0, 10, 0] }}
          transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
          className="absolute top-20 left-[10%] w-32 h-32 rounded-full bg-gradient-to-br from-purple-300/30 to-indigo-300/20 blur-xl"
        />
        <motion.div
          animate={{ y: [0, 25, 0], x: [0, -15, 0] }}
          transition={{ duration: 10, repeat: Infinity, ease: "easeInOut", delay: 1 }}
          className="absolute bottom-32 right-[15%] w-40 h-40 rounded-full bg-gradient-to-br from-blue-300/25 to-purple-300/15 blur-xl"
        />
        <motion.div
          animate={{ y: [0, 15, 0] }}
          transition={{ duration: 6, repeat: Infinity, ease: "easeInOut", delay: 2 }}
          className="absolute top-1/2 right-[5%] w-24 h-24 rounded-full bg-gradient-to-br from-violet-300/30 to-pink-300/20 blur-lg"
        />

        {/* Geometric Shapes */}
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          className="absolute top-[15%] right-[20%] w-48 h-48 border border-purple-200/30 rounded-full"
        />
        <motion.div
          animate={{ rotate: -360 }}
          transition={{ duration: 45, repeat: Infinity, ease: "linear" }}
          className="absolute bottom-[20%] left-[8%] w-36 h-36 border border-indigo-200/30 rounded-2xl"
        />
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
          className="absolute top-[60%] left-[15%] w-20 h-20 border border-violet-200/30"
          style={{ borderRadius: '30% 70% 70% 30% / 30% 30% 70% 70%' }}
        />

        {/* Small Dots */}
        {[...Array(5)].map((_, i) => (
          <motion.div
            key={i}
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.2, 1] }}
            transition={{ duration: 3 + i, repeat: Infinity, delay: i * 0.5 }}
            className="absolute w-2 h-2 rounded-full bg-purple-400/40"
            style={{ top: `${20 + i * 15}%`, left: `${5 + i * 20}%` }}
          />
        ))}
      </div>

      {/* Main Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-10 w-full max-w-6xl h-[calc(100vh-2rem)] max-h-[850px] flex bg-white rounded-2xl shadow-2xl shadow-purple-200/50 overflow-hidden"
      >
        {/* Left Side - Info Panel */}
        <div className="hidden lg:flex w-1/3 bg-gradient-to-br from-[#f5f3ff] to-[#ede9fe] p-6 flex-col relative">
          {/* Logo */}
          <div className="flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="Logo" className="w-10 h-10 rounded-xl object-contain" />
            <span className="text-sm font-bold text-gray-800">SecureHire</span>
          </div>

          {/* Progress */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-gray-600">Registration Progress</span>
              <span className="text-xs font-bold text-purple-600">{Math.round(progress)}%</span>
            </div>
            <div className="h-2 bg-white/60 rounded-full overflow-hidden">
              <motion.div
                animate={{ width: `${progress}%` }}
                className="h-full bg-gradient-to-r from-purple-600 to-indigo-600 rounded-full"
              />
            </div>
          </div>

          {/* Steps */}
          <div className="space-y-4 flex-1">
            <StepItem
              icon={<User className="w-4 h-4" />}
              title="Personal Details"
              description="Your name and email"
              completed={!!formData.fullName}
            />
            <StepItem
              icon={<GraduationCap className="w-4 h-4" />}
              title="Academic Info"
              description="College and department"
              completed={!!formData.college && !!formData.department}
            />
            <StepItem
              icon={<Hash className="w-4 h-4" />}
              title="Registration"
              description="Reg number and CGPA"
              completed={!!formData.registrationNumber && !!formData.cgpa}
            />
            <StepItem
              icon={<Upload className="w-4 h-4" />}
              title="Documents"
              description="Resume & ID (Optional)"
              completed={!!formData.resumeUrl || !!formData.idCardUrl}
              optional
            />
          </div>

          {/* Illustration */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
            className="mt-4"
          >
            <img src="/otp-security.svg" alt="Security" className="w-full max-w-[200px] mx-auto opacity-80" />
          </motion.div>

          {/* Decorative */}
          <motion.div
            animate={{ scale: [1, 1.1, 1] }}
            transition={{ duration: 4, repeat: Infinity }}
            className="absolute bottom-20 right-4 w-16 h-16 rounded-full bg-purple-200/50"
          />
        </div>

        {/* Right Side - Form */}
        <div className="w-full lg:w-2/3 flex flex-col">
          {/* Scrollable Form Content */}
          <div className="flex-1 overflow-y-auto p-6 lg:p-8" style={{ scrollbarWidth: 'thin', scrollbarColor: '#d4d4d8 transparent' }}>
            {/* Header */}
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-3"
            >
              <h1 className="text-lg font-bold text-gray-900">Complete Your Profile</h1>
              <p className="text-gray-500 text-xs">Fill in your details to continue</p>
            </motion.div>

            {/* Email (Read-only) */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.1 }}
              className="mb-3 p-2 bg-purple-50 rounded-lg border border-purple-100"
            >
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-100 flex items-center justify-center">
                  <Mail className="w-4 h-4 text-purple-600" />
                </div>
                <div className="flex-1">
                  <p className="text-[10px] text-purple-600 font-medium uppercase tracking-wide">Verified Email</p>
                  <p className="text-xs font-semibold text-gray-800">{email}</p>
                </div>
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>
            </motion.div>

            {/* Form Sections */}
            <div className="space-y-6">
              {/* Personal Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.15 }}
              >
                <SectionHeader icon={<User />} title="Personal Information" />
                <div className="mt-4">
                  <Input
                    label="Full Name"
                    required
                    placeholder="Enter your full name"
                    icon={<User className="w-4 h-4" />}
                    value={formData.fullName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, fullName: e.target.value })}
                  />
                </div>
              </motion.div>

              {/* Academic Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 }}
              >
                <SectionHeader icon={<GraduationCap />} title="Academic Information" />
                <div className="mt-3 space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="College / University"
                      required
                      placeholder="Enter institution"
                      icon={<Building className="w-4 h-4" />}
                      value={formData.college}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, college: e.target.value })}
                    />
                    <Input
                      label="Department"
                      required
                      placeholder="e.g. Computer Science"
                      icon={<GraduationCap className="w-4 h-4" />}
                      value={formData.department}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, department: e.target.value })}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <Input
                      label="Registration No."
                      required
                      placeholder="e.g. CS2021001"
                      icon={<Hash className="w-4 h-4" />}
                      value={formData.registrationNumber}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, registrationNumber: e.target.value })}
                    />
                    <Input
                      label="CGPA"
                      required
                      type="number"
                      placeholder="e.g. 8.5"
                      icon={<Award className="w-4 h-4" />}
                      value={formData.cgpa}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, cgpa: e.target.value })}
                    />
                  </div>
                </div>
              </motion.div>

              {/* Documents Section */}
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.25 }}
              >
                <SectionHeader icon={<Upload />} title="Documents" subtitle="Optional" />
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <div className="p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 transition-colors bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <FileText className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">Resume / CV</p>
                        <p className="text-[10px] text-gray-500">PDF, max 5MB</p>
                      </div>
                    </div>
                    <FileUpload
                      accept=".pdf"
                      maxSize={5}
                      onUpload={handleResumeUpload}
                      label=""
                      description=""
                    />
                  </div>
                  <div className="p-3 border-2 border-dashed border-gray-200 rounded-xl hover:border-purple-300 transition-colors bg-gray-50/50">
                    <div className="flex items-center gap-2 mb-2">
                      <CreditCard className="w-4 h-4 text-purple-500" />
                      <div>
                        <p className="text-xs font-medium text-gray-800">ID Card</p>
                        <p className="text-[10px] text-gray-500">Image, max 5MB</p>
                      </div>
                    </div>
                    <FileUpload
                      accept="image/*"
                      maxSize={5}
                      onUpload={handleIdCardUpload}
                      label=""
                      description=""
                    />
                  </div>
                </div>
              </motion.div>
            </div>
          </div>

          {/* Sticky Footer with Button */}
          <div className="p-4 border-t border-gray-100 bg-white">
            <AnimatePresence>
              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="mb-3 bg-red-50 border border-red-200 text-red-600 text-xs px-3 py-2 rounded-lg"
                >
                  {error}
                </motion.div>
              )}
            </AnimatePresence>

            <motion.button
              whileHover={isFormValid && !loading ? { scale: 1.01 } : {}}
              whileTap={isFormValid && !loading ? { scale: 0.99 } : {}}
              onClick={handleSubmit}
              disabled={loading || !isFormValid}
              className={`w-full py-3 rounded-lg font-semibold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${isFormValid ? 'bg-gradient-to-r from-purple-600 to-indigo-600 text-white shadow-purple-200 hover:shadow-lg' : 'bg-gray-200 text-gray-400 cursor-not-allowed'}`}
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Registering...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  Complete Registration
                  <ArrowRight className="h-4 w-4" />
                </>
              )}
            </motion.button>

            <div className="mt-2 flex items-center justify-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />
              <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wider">Secure</span>
              <span className="text-gray-300">•</span>
              <span className="text-[10px] text-gray-400"><span className="text-red-400">*</span> Required</span>
            </div>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

/* ================= Reusable Components ================= */

function StepItem({ icon, title, description, completed, optional }: any) {
  return (
    <motion.div
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      className={`flex items-start gap-3 p-3 rounded-xl transition-all ${completed ? 'bg-white/80' : 'bg-white/40'}`}
    >
      <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${completed ? 'bg-green-100 text-green-600' : 'bg-gray-100 text-gray-400'}`}>
        {completed ? <CheckCircle className="w-4 h-4" /> : icon}
      </div>
      <div className="flex-1">
        <p className={`text-sm font-medium ${completed ? 'text-gray-800' : 'text-gray-600'}`}>{title}</p>
        <p className="text-xs text-gray-500">{description}</p>
      </div>
      {optional && <span className="text-[10px] text-gray-400 bg-gray-100 px-2 py-0.5 rounded-full">Optional</span>}
    </motion.div>
  );
}

function SectionHeader({ icon, title, subtitle }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="w-9 h-9 rounded-lg bg-purple-100 text-purple-600 flex items-center justify-center">
        {icon}
      </div>
      <div>
        <h2 className="text-sm font-semibold text-gray-900">{title}</h2>
        {subtitle && <p className="text-xs text-gray-500">{subtitle}</p>}
      </div>
    </div>
  );
}

function Input({ label, required, icon, ...props }: any) {
  return (
    <div>
      <label className="text-sm font-medium text-gray-700 mb-1.5 block">
        {label} {required && <span className="text-red-500">*</span>}
      </label>
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-purple-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          {...props}
          className={`w-full h-10 ${icon ? 'pl-10' : 'pl-4'} pr-4 rounded-lg bg-gray-50 border-2 border-gray-200 focus:border-purple-500 focus:ring-2 focus:ring-purple-500/10 outline-none text-sm placeholder:text-gray-400 transition-all`}
        />
      </div>
    </div>
  );
}
