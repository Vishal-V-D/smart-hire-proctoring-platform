# Plagiarism Detection - Implementation Guide

## Overview
Plagiarism detection has been integrated into the assessment setup system with 5 REST API endpoints for managing plagiarism configurations and checking submission status.

---

## 📁 File Structure

### Service Layer
**File:** `src/api/plagiarismService.ts`

This service file handles all plagiarism-related API calls with the following methods:

```typescript
// 1. Get plagiarism config
getPlagiarismConfig(assessmentId: string): Promise<PlagiarismConfig>

// 2. Save plagiarism config  
savePlagiarismConfig(assessmentId: string, config: PlagiarismConfig): Promise<PlagiarismConfig>

// 3. Reset plagiarism config to defaults
resetPlagiarismConfig(assessmentId: string): Promise<PlagiarismConfig>

// 4. Check plagiarism status for submission
checkPlagiarismStatus(assessmentId: string, submissionId: string): Promise<PlagiarismStatusResponse>

// 5. Webhook handler (for external plagiarism provider)
handlePlagiarismWebhook(payload: WebhookPayload): Promise<void>
```

### Component Integration
**File:** `src/app/organizer/new-assessment/components/AssessmentSetup.tsx`

The AssessmentSetup component now includes:
- Plagiarism detection toggle
- Strictness level selector (Low | Medium | High)
- Similarity threshold slider (0-100%)
- AI sensitivity selector (Low | Medium | High)
- Report configuration options
- Save and Reset buttons

---

## 🔌 API Endpoints

### 1. Get Config
```
GET /api/assessments/:id/plagiarism-config
```
**Requires Auth:** ✅ Yes

**Response:**
```json
{
  "enabled": true,
  "strictness": "High",
  "similarityThreshold": 60,
  "aiSensitivity": "High",
  "reportConfig": {
    "includeSourceCode": true,
    "includeMatches": true,
    "includeAiAnalysis": true,
    "includeVerdict": true
  }
}
```

---

### 2. Save Config
```
PUT /api/assessments/:id/plagiarism-config
```
**Requires Auth:** ✅ Yes

**Request Body:**
```json
{
  "strictness": "High",
  "similarityThreshold": 60,
  "aiSensitivity": "High",
  "reportConfig": {
    "includeSourceCode": true,
    "includeMatches": true,
    "includeAiAnalysis": true,
    "includeVerdict": true
  }
}
```

**Response:** Same as Get Config

---

### 3. Reset Config
```
POST /api/assessments/:id/plagiarism-config/reset
```
**Requires Auth:** ✅ Yes

**Response:** Resets to default values
```json
{
  "enabled": false,
  "strictness": "Medium",
  "similarityThreshold": 75,
  "aiSensitivity": "Medium",
  "reportConfig": {
    "includeSourceCode": true,
    "includeMatches": true,
    "includeAiAnalysis": true,
    "includeVerdict": true
  }
}
```

---

### 4. Check Status
```
GET /api/contestant/assessments/:id/submissions/:submissionId/plagiarism-status
```
**Requires Auth:** ✅ Yes

**Response:**
```json
{
  "submissionId": "sub_123",
  "assessmentId": "assess_123",
  "status": "completed",
  "similarity": 45,
  "aiScore": 67,
  "detectedAt": "2026-01-05T10:30:00Z",
  "report": {
    "sourceCode": "...",
    "matches": [
      {
        "source": "GitHub repo X",
        "percentage": 35
      }
    ],
    "aiAnalysis": "...",
    "verdict": "..."
  }
}
```

---

### 5. Webhook Handler
```
POST /api/contestant/assessments/webhook/plagiarism
```
**Requires Auth:** ❌ No (Webhook endpoint)

**Request Body:**
```json
{
  "submissionId": "sub_123",
  "assessmentId": "assess_123",
  "status": "completed",
  "similarity": 45,
  "aiScore": 67,
  "timestamp": "2026-01-05T10:30:00Z"
}
```

---

## 🎯 Usage in Component

### Initialize Service
```typescript
import plagiarismService from '@/api/plagiarismService';
```

### Load Config on Edit Mode
```typescript
useEffect(() => {
    if (isEditMode && assessmentId) {
        loadPlagiarismConfig(assessmentId);
    }
}, [isEditMode, assessmentId]);

const loadPlagiarismConfig = async (id: string) => {
    const config = await plagiarismService.getPlagiarismConfig(id);
    setPlagiarismConfig(config);
};
```

### Save Configuration
```typescript
const savePlagiarismConfig = async () => {
    const configToSave: PlagiarismConfig = {
        ...plagiarismConfig,
        enabled: plagiarismEnabled,
    };
    const result = await plagiarismService.savePlagiarismConfig(assessmentId, configToSave);
    setPlagiarismConfig(result);
};
```

### Check Submission Status
```typescript
const getSubmissionStatus = async (submissionId: string) => {
    const status = await plagiarismService.checkPlagiarismStatus(assessmentId, submissionId);
    console.log(`Similarity: ${status.similarity}%`);
    console.log(`AI Score: ${status.aiScore}%`);
};
```

---

## 📊 Type Definitions

### PlagiarismConfig
```typescript
interface PlagiarismConfig {
    enabled?: boolean;
    strictness: "Low" | "Medium" | "High";
    similarityThreshold: number; // 0-100
    aiSensitivity: "Low" | "Medium" | "High";
    reportConfig: PlagiarismReportConfig;
}
```

### PlagiarismReportConfig
```typescript
interface PlagiarismReportConfig {
    includeSourceCode: boolean;
    includeMatches: boolean;
    includeAiAnalysis: boolean;
    includeVerdict: boolean;
}
```

### PlagiarismStatusResponse
```typescript
interface PlagiarismStatusResponse {
    submissionId: string;
    assessmentId: string;
    status: "pending" | "processing" | "completed" | "failed";
    similarity: number;
    aiScore: number;
    detectedAt?: string;
    report?: {
        sourceCode?: string;
        matches?: Array<{
            source: string;
            percentage: number;
        }>;
        aiAnalysis?: string;
        verdict?: string;
    };
}
```

---

## 🚀 Component Props

### AssessmentSetupProps
```typescript
interface AssessmentSetupProps {
    config: AssessmentConfig;
    setConfig: (config: AssessmentConfig) => void;
    onNext: () => void;
    isEditMode?: boolean;
    assessmentId?: string; // Required for plagiarism operations
}
```

**Important:** Pass `assessmentId` prop when using plagiarism features in edit mode.

---

## 💡 Features

✅ **Enable/Disable:** Toggle plagiarism detection on/off
✅ **Strictness Levels:** Low, Medium, High
✅ **Similarity Threshold:** Configurable from 0-100%
✅ **AI Sensitivity:** Low, Medium, High
✅ **Report Configuration:** Choose what to include in plagiarism reports
✅ **Save/Reset:** Persist or revert to defaults
✅ **Status Checking:** Track submission plagiarism status
✅ **Webhook Support:** Receive plagiarism results asynchronously

---

## 🔒 Security Notes

- Endpoints 1-4 require authentication
- Webhook endpoint (5) does NOT require authentication (callback from provider)
- All configurations stored per assessment
- Sensitive report data protected via access controls

---

## 📝 Example Integration

```typescript
// In your page or parent component
import AssessmentSetup from './components/AssessmentSetup';

export default function NewAssessment() {
    const [config, setConfig] = useState<AssessmentConfig>({...});
    const assessmentId = "assess_123"; // from URL params in edit mode

    return (
        <AssessmentSetup
            config={config}
            setConfig={setConfig}
            onNext={handleNext}
            isEditMode={true}
            assessmentId={assessmentId}
        />
    );
}
```

---

## ⚠️ Error Handling

All service methods include try-catch blocks with console logging:

```typescript
try {
    const config = await plagiarismService.getPlagiarismConfig(id);
    // Success
} catch (error) {
    console.error('Failed to load plagiarism config:', error);
    // Handle error
}
```

---

## 🎨 UI Components

- **Toggle Switch:** Enable/disable plagiarism detection
- **Dropdown Selects:** Strictness and AI sensitivity levels
- **Range Slider:** Similarity threshold (0-100%)
- **Toggle Rows:** Report configuration options
- **Action Buttons:** Save and Reset functionality

All styled consistently with the existing design system.
