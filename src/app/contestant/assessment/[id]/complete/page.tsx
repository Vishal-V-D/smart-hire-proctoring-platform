'use client';

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { CheckCircle2, Home, FileText, Clock, Award } from 'lucide-react';
import { contestantService } from '@/api/contestantService';

export default function CompletePage() {
    const router = useRouter();

    useEffect(() => {
        // Clear session after completion
        contestantService.clearSession();
    }, []);

    return (
        <div className="min-h-screen bg-gradient-to-br from-green-500/10 via-background to-primary/10">
            <div className="flex justify-center p-4 py-12">
                <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="max-w-2xl w-full"
                >
                    {/* Success Animation */}
                    <div className="text-center mb-8">
                        <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
                            className="inline-flex items-center justify-center w-24 h-24 rounded-full bg-green-500/10 mb-6"
                        >
                            <CheckCircle2 className="h-16 w-16 text-green-500" />
                        </motion.div>
                        <motion.h1
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.4 }}
                            className="text-4xl font-bold text-foreground mb-3"
                        >
                            Assessment Submitted Successfully!
                        </motion.h1>
                        <motion.p
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            transition={{ delay: 0.6 }}
                            className="text-lg text-muted-foreground"
                        >
                            Thank you for completing the assessment
                        </motion.p>
                    </div>

                    {/* Info Cards */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                        className="bg-card border border-border rounded-2xl p-8 shadow-xl mb-6"
                    >
                        <h2 className="text-xl font-bold text-foreground mb-6">What Happens Next?</h2>

                        <div className="space-y-4">
                            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <FileText className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Evaluation in Progress</h3>
                                    <p className="text-sm text-muted-foreground">
                                        Your responses are being evaluated by our team. This process may take a few days.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Clock className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Results Notification</h3>
                                    <p className="text-sm text-muted-foreground">
                                        You'll receive an email notification once your results are ready.
                                    </p>
                                </div>
                            </div>

                            <div className="flex items-start gap-4 p-4 bg-muted/30 rounded-lg">
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center shrink-0">
                                    <Award className="h-5 w-5 text-primary" />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-foreground mb-1">Next Steps</h3>
                                    <p className="text-sm text-muted-foreground">
                                        If you qualify, you'll be contacted for the next round of the selection process.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </motion.div>


                  

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 1.4 }}
                        className="text-center text-sm text-muted-foreground mt-6"
                    >
                        Thank you for using SecureHire Assessment Platform
                    </motion.p>
                </motion.div>
            </div>
        </div>
    );
}
