# 💻 Plagiarism Detection - Code Examples

## 1. Direct Service Usage

### Get Plagiarism Config
```typescript
import plagiarismService from '@/api/plagiarismService';

// Fetch config for an assessment
const config = await plagiarismService.getPlagiarismConfig('assess_123');

console.log('Strictness:', config.strictness);
console.log('Threshold:', config.similarityThreshold);
console.log('Similarity enabled:', config.enabled);
```

### Save Plagiarism Config
```typescript
import plagiarismService, { PlagiarismConfig } from '@/api/plagiarismService';

const newConfig: PlagiarismConfig = {
    enabled: true,
    strictness: 'High',
    similarityThreshold: 60,
    aiSensitivity: 'High',
    reportConfig: {
        includeSourceCode: true,
        includeMatches: true,
        includeAiAnalysis: true,
        includeVerdict: true,
    }
};

const saved = await plagiarismService.savePlagiarismConfig('assess_123', newConfig);
console.log('Saved:', saved);
```

### Reset to Defaults
```typescript
const defaultConfig = await plagiarismService.resetPlagiarismConfig('assess_123');
console.log('Reset to defaults:', defaultConfig);
```

### Check Submission Status
```typescript
const status = await plagiarismService.checkPlagiarismStatus(
    'assess_123',
    'sub_456'
);

console.log('Status:', status.status); // pending | processing | completed | failed
console.log('Similarity:', status.similarity); // percentage
console.log('AI Score:', status.aiScore); // percentage

if (status.report) {
    console.log('Report matches:');
    status.report.matches?.forEach(match => {
        console.log(`- ${match.source}: ${match.percentage}%`);
    });
}
```

### Handle Webhook
```typescript
import plagiarismService, { WebhookPayload } from '@/api/plagiarismService';

const webhookPayload: WebhookPayload = {
    submissionId: 'sub_456',
    assessmentId: 'assess_123',
    status: 'completed',
    similarity: 45,
    aiScore: 67,
    timestamp: new Date().toISOString(),
};

await plagiarismService.handlePlagiarismWebhook(webhookPayload);
```

---

## 2. Component Integration Examples

### Basic Setup
```typescript
import React, { useState } from 'react';
import AssessmentSetup from './components/AssessmentSetup';
import { AssessmentConfig } from './types';

export default function CreateAssessment() {
    const [config, setConfig] = useState<AssessmentConfig>({
        title: '',
        description: '',
        startDate: '',
        endDate: '',
        duration: 60,
        timeMode: 'global',
        globalTime: 60,
        proctoring: {
            enabled: false,
            videoMonitoring: false,
            screenRecording: false,
            imageMonitoring: false,
            audioMonitoring: false,
            audioRecording: false,
            objectDetection: false,
            personDetection: false,
            faceDetection: false,
            eyeTracking: false,
            noiseDetection: false,
            fullscreen: false,
            tabSwitchLimit: 3,
            disableCopyPaste: false,
            blockExternalMonitor: false,
            blockRightClick: false,
            verifyIDCard: false,
            verifyFace: false,
        },
        navigation: {
            allowPreviousNavigation: true,
            allowMarkForReview: true,
        },
    });

    return (
        <AssessmentSetup
            config={config}
            setConfig={setConfig}
            onNext={() => console.log('Next clicked')}
            isEditMode={false}
        />
    );
}
```

### Edit Mode with Assessment ID
```typescript
import { useParams } from 'next/navigation';

export default function EditAssessment() {
    const { assessmentId } = useParams();
    const [config, setConfig] = useState<AssessmentConfig>({...});

    return (
        <AssessmentSetup
            config={config}
            setConfig={setConfig}
            onNext={() => handleSave()}
            isEditMode={true}
            assessmentId={assessmentId as string}
        />
    );
}
```

### Using Plagiarism Config Data
```typescript
const handleSave = async () => {
    // Plagiarism settings are already saved via the component's
    // internal savePlagiarismConfig() method
    
    // If you need to access the config, you can:
    // 1. Pass it as prop from AssessmentSetup to parent
    // 2. Or fetch it again using the service
    
    const plagiarismConfig = await plagiarismService.getPlagiarismConfig(assessmentId);
    
    // Now save the full assessment with plagiarism settings
    await assessmentService.createAssessment({
        ...config,
        plagiarismSettings: plagiarismConfig,
    });
};
```

---

## 3. Advanced Patterns

### Auto-Save Configuration
```typescript
import { debounce } from 'lodash'; // or use your own debounce

const debouncedSave = debounce(async () => {
    try {
        await plagiarismService.savePlagiarismConfig(
            assessmentId,
            plagiarismConfig
        );
        setAutoSaveStatus('Saved');
    } catch (error) {
        setAutoSaveStatus('Failed to save');
    }
}, 1000);

// Call on any config change
useEffect(() => {
    debouncedSave();
}, [plagiarismConfig]);
```

### Monitor Submission Progress
```typescript
const startPlagiarismCheck = async (submissionId: string) => {
    const maxAttempts = 30;
    let attempts = 0;

    const interval = setInterval(async () => {
        try {
            const status = await plagiarismService.checkPlagiarismStatus(
                assessmentId,
                submissionId
            );

            if (status.status === 'completed' || status.status === 'failed') {
                clearInterval(interval);
                handleCheckComplete(status);
            }

            attempts++;
            if (attempts >= maxAttempts) {
                clearInterval(interval);
                setError('Plagiarism check timed out');
            }
        } catch (error) {
            clearInterval(interval);
            setError('Failed to check plagiarism status');
        }
    }, 2000); // Check every 2 seconds
};
```

### Bulk Update Multiple Assessments
```typescript
const updateMultipleAssessments = async (
    assessmentIds: string[],
    newConfig: PlagiarismConfig
) => {
    const results = await Promise.allSettled(
        assessmentIds.map(id => 
            plagiarismService.savePlagiarismConfig(id, newConfig)
        )
    );

    const successful = results.filter(r => r.status === 'fulfilled').length;
    const failed = results.filter(r => r.status === 'rejected').length;

    console.log(`Updated: ${successful}, Failed: ${failed}`);
};
```

### Export Plagiarism Report
```typescript
const exportPlagiarismReport = async (
    assessmentId: string,
    submissionId: string
) => {
    const status = await plagiarismService.checkPlagiarismStatus(
        assessmentId,
        submissionId
    );

    const report = {
        submission: submissionId,
        similarity: status.similarity,
        aiScore: status.aiScore,
        checkedAt: status.detectedAt,
        report: status.report,
    };

    // Generate PDF or download JSON
    const jsonString = JSON.stringify(report, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `plagiarism-report-${submissionId}.json`;
    link.click();
};
```

---

## 4. Custom Hooks

### usePlagiarismConfig Hook
```typescript
import { useState, useEffect } from 'react';
import plagiarismService, { PlagiarismConfig } from '@/api/plagiarismService';

export function usePlagiarismConfig(assessmentId: string) {
    const [config, setConfig] = useState<PlagiarismConfig | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await plagiarismService.getPlagiarismConfig(assessmentId);
            setConfig(result);
        } catch (err) {
            setError('Failed to load plagiarism config');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const saveConfig = async (newConfig: PlagiarismConfig) => {
        setLoading(true);
        setError(null);
        try {
            const result = await plagiarismService.savePlagiarismConfig(
                assessmentId,
                newConfig
            );
            setConfig(result);
            return result;
        } catch (err) {
            setError('Failed to save plagiarism config');
            console.error(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    const resetConfig = async () => {
        setLoading(true);
        setError(null);
        try {
            const result = await plagiarismService.resetPlagiarismConfig(assessmentId);
            setConfig(result);
            return result;
        } catch (err) {
            setError('Failed to reset plagiarism config');
            console.error(err);
            throw err;
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (assessmentId) {
            loadConfig();
        }
    }, [assessmentId]);

    return { config, loading, error, saveConfig, resetConfig, loadConfig };
}

// Usage in component
const { config, loading, saveConfig } = usePlagiarismConfig(assessmentId);
```

### usePlagiarismStatus Hook
```typescript
import { useState, useEffect } from 'react';
import plagiarismService, { PlagiarismStatusResponse } from '@/api/plagiarismService';

export function usePlagiarismStatus(
    assessmentId: string,
    submissionId: string,
    pollInterval: number = 2000
) {
    const [status, setStatus] = useState<PlagiarismStatusResponse | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    useEffect(() => {
        if (!assessmentId || !submissionId) return;

        let isMounted = true;
        let intervalId: NodeJS.Timeout;

        const checkStatus = async () => {
            setLoading(true);
            setError(null);
            try {
                const result = await plagiarismService.checkPlagiarismStatus(
                    assessmentId,
                    submissionId
                );
                if (isMounted) {
                    setStatus(result);

                    // Stop polling if complete
                    if (result.status === 'completed' || result.status === 'failed') {
                        clearInterval(intervalId);
                    }
                }
            } catch (err) {
                if (isMounted) {
                    setError('Failed to check plagiarism status');
                    console.error(err);
                }
            } finally {
                if (isMounted) {
                    setLoading(false);
                }
            }
        };

        checkStatus();
        intervalId = setInterval(checkStatus, pollInterval);

        return () => {
            isMounted = false;
            clearInterval(intervalId);
        };
    }, [assessmentId, submissionId, pollInterval]);

    return { status, loading, error };
}

// Usage in component
const { status, loading } = usePlagiarismStatus(assessmentId, submissionId);
if (loading) return <div>Checking...</div>;
if (status?.status === 'completed') {
    return <div>Similarity: {status.similarity}%</div>;
}
```

---

## 5. Error Handling

### Comprehensive Error Handling
```typescript
const handlePlagiarismOperation = async (operation: string) => {
    try {
        switch (operation) {
            case 'load':
                await loadPlagiarismConfig(assessmentId);
                break;
            case 'save':
                await savePlagiarismConfig();
                break;
            case 'reset':
                await resetPlagiarismConfig();
                break;
            default:
                throw new Error('Unknown operation');
        }
        setSuccess('Operation completed successfully');
    } catch (error) {
        if (error instanceof Error) {
            if (error.message.includes('404')) {
                setError('Assessment not found');
            } else if (error.message.includes('403')) {
                setError('You do not have permission');
            } else if (error.message.includes('500')) {
                setError('Server error. Please try again later');
            } else {
                setError(error.message);
            }
        } else {
            setError('An unexpected error occurred');
        }
    }
};
```

---

## 6. Testing Examples

### Unit Test
```typescript
import { describe, it, expect, vi } from 'vitest';
import plagiarismService from '@/api/plagiarismService';

describe('plagiarismService', () => {
    it('should get plagiarism config', async () => {
        const mockConfig = {
            strictness: 'High',
            similarityThreshold: 60,
            aiSensitivity: 'High',
            reportConfig: {
                includeSourceCode: true,
                includeMatches: true,
                includeAiAnalysis: true,
                includeVerdict: true,
            }
        };

        // Mock the axios call
        vi.mock('@/api/axiosContestClient');

        const config = await plagiarismService.getPlagiarismConfig('assess_123');
        expect(config.strictness).toBe('High');
    });

    it('should save plagiarism config', async () => {
        const newConfig = {
            strictness: 'Medium',
            similarityThreshold: 75,
            aiSensitivity: 'Medium',
            reportConfig: {
                includeSourceCode: true,
                includeMatches: true,
                includeAiAnalysis: false,
                includeVerdict: true,
            }
        };

        const saved = await plagiarismService.savePlagiarismConfig('assess_123', newConfig);
        expect(saved.strictness).toBe('Medium');
    });
});
```

---

## 7. Integration with Other Services

### Combined with Assessment Service
```typescript
const createAssessmentWithPlagiarism = async () => {
    // 1. Create assessment
    const assessment = await assessmentService.createAssessment(config);

    // 2. Configure plagiarism
    const plagiarismConfig = {
        enabled: true,
        strictness: 'High' as const,
        similarityThreshold: 60,
        aiSensitivity: 'High' as const,
        reportConfig: {
            includeSourceCode: true,
            includeMatches: true,
            includeAiAnalysis: true,
            includeVerdict: true,
        }
    };

    await plagiarismService.savePlagiarismConfig(
        assessment.id,
        plagiarismConfig
    );

    return assessment;
};
```

All examples are ready to copy-paste and adapt to your needs! 🚀
