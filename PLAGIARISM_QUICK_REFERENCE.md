# 🎯 Plagiarism Detection - Quick Reference

## Service Architecture

```
┌─────────────────────────────────────────────────────────────┐
│  AssessmentSetup.tsx (Component)                            │
│  - Plagiarism UI Section                                    │
│  - State Management                                         │
│  - Service Method Calls                                     │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  plagiarismService.ts (Service Layer)                       │
│  - getPlagiarismConfig()          [GET]                     │
│  - savePlagiarismConfig()         [PUT]                     │
│  - resetPlagiarismConfig()        [POST]                    │
│  - checkPlagiarismStatus()        [GET]                     │
│  - handlePlagiarismWebhook()      [POST]                    │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  axiosContestClient (HTTP Client)                           │
│  - Authentication Middleware                                │
│  - Error Handling                                           │
└───────────────────┬─────────────────────────────────────────┘
                    │
                    ▼
┌─────────────────────────────────────────────────────────────┐
│  Backend API Endpoints                                      │
│  - /api/assessments/:id/plagiarism-config                  │
│  - /api/contestant/assessments/...                         │
└─────────────────────────────────────────────────────────────┘
```

---

## Component Flow

```
┌────────────────────────────────────────────────────────────┐
│ 1. Component Mount                                         │
│    └─ useEffect checks isEditMode & assessmentId          │
│       └─ Calls loadPlagiarismConfig()                     │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│ 2. User Toggles / Adjusts Settings                         │
│    └─ updatePlagiarismSetting()                           │
│    └─ updatePlagiarismReportConfig()                      │
│    └─ setPlagiarismEnabled()                              │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│ 3. User Clicks Save/Reset                                 │
│    ├─ Save Button                                         │
│    │  └─ savePlagiarismConfig()                          │
│    │     └─ PUT /api/assessments/:id/plagiarism-config   │
│    │                                                      │
│    └─ Reset Button                                        │
│       └─ resetPlagiarismConfig()                         │
│          └─ POST /api/assessments/:id/plagiarism-...     │
└────────────────────────────────────────────────────────────┘
                            │
                            ▼
┌────────────────────────────────────────────────────────────┐
│ 4. Response Handling                                       │
│    └─ Update State                                        │
│    └─ Handle Errors                                       │
│    └─ Show Loading/Success States                         │
└────────────────────────────────────────────────────────────┘
```

---

## Config Data Model

```json
{
  "enabled": boolean,
  "strictness": "Low" | "Medium" | "High",
  "similarityThreshold": 0-100,
  "aiSensitivity": "Low" | "Medium" | "High",
  "reportConfig": {
    "includeSourceCode": boolean,
    "includeMatches": boolean,
    "includeAiAnalysis": boolean,
    "includeVerdict": boolean
  }
}
```

---

## API Response Models

### Get/Save/Reset Config Response
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

### Check Status Response
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

### Webhook Payload
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

## UI Layout

```
┌─────────────────────────────────────────────────────────┐
│                  Assessment Details                     │
│  ┌───────────────────────────────────────────────────┐  │
│  │  Title Input                                      │  │
│  │  Description Textarea                             │  │
│  │  Start Date/Time Input                            │  │
│  │  End Date/Time Input                              │  │
│  │                                                   │  │
│  │  Navigation Settings                              │  │
│  │  ├─ Allow Previous Navigation [Toggle]            │  │
│  │  └─ Allow Mark for Review [Toggle]               │  │
│  │                                                   │  │
│  │  PLAGIARISM DETECTION ← NEW!                     │  │
│  │  ├─ Enable [Toggle]                              │  │
│  │  └─ Settings Panel (if enabled):                 │  │
│  │     ├─ Strictness Dropdown                       │  │
│  │     ├─ Similarity Threshold Slider               │  │
│  │     ├─ AI Sensitivity Dropdown                   │  │
│  │     ├─ Report Configuration:                     │  │
│  │     │  ├─ Include Source Code [Toggle]           │  │
│  │     │  ├─ Include Matches [Toggle]               │  │
│  │     │  ├─ Include AI Analysis [Toggle]           │  │
│  │     │  └─ Include Verdict [Toggle]               │  │
│  │     ├─ Save Config Button                        │  │
│  │     └─ Reset Button                              │  │
│  │                                                   │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
```

---

## State Management

```typescript
// Main Configuration
const [plagiarismConfig, setPlagiarismConfig] = useState<PlagiarismConfig>({
    strictness: 'Medium',
    similarityThreshold: 75,
    aiSensitivity: 'Medium',
    reportConfig: {
        includeSourceCode: true,
        includeMatches: true,
        includeAiAnalysis: true,
        includeVerdict: true,
    },
});

// Toggle States
const [plagiarismEnabled, setPlagiarismEnabled] = useState(false);
const [loadingPlagiarism, setLoadingPlagiarism] = useState(false);
const [savingPlagiarism, setSavingPlagiarism] = useState(false);
```

---

## Event Handlers

```typescript
// Load existing config on component mount (edit mode)
useEffect(() => {...}, [isEditMode, assessmentId])

// Update strictness/threshold/sensitivity
updatePlagiarismSetting(field, value)

// Update report inclusion options
updatePlagiarismReportConfig(field, value)

// API Calls
loadPlagiarismConfig()      // Fetch from server
savePlagiarismConfig()      // Save to server
resetPlagiarismConfig()     // Reset to defaults
checkPlagiarismStatus()     // Get submission status
```

---

## Integration Checklist

- [x] Service file created (`plagiarismService.ts`)
- [x] All 5 endpoint methods implemented
- [x] Type definitions exported
- [x] Component imports updated
- [x] State management added
- [x] UI section added with proper styling
- [x] Service method integrations complete
- [x] Error handling in place
- [x] Loading states handled
- [x] Documentation created
- [ ] Backend endpoints implemented
- [ ] Testing in environment
- [ ] Production deployment

---

## Common Usage Patterns

### Load Config on Page Load
```typescript
useEffect(() => {
    loadPlagiarismConfig(assessmentId);
}, [assessmentId]);
```

### Save After Changes
```typescript
const handleSave = () => {
    savePlagiarismConfig();
};
```

### Check Submission Status
```typescript
const handleCheckStatus = async (submissionId: string) => {
    const status = await plagiarismService.checkPlagiarismStatus(
        assessmentId,
        submissionId
    );
    console.log(`Similarity: ${status.similarity}%`);
};
```

### Handle Webhook
```typescript
// This runs on your server when plagiarism provider sends results
const handleWebhook = async (payload: WebhookPayload) => {
    await plagiarismService.handlePlagiarismWebhook(payload);
};
```

---

## Debugging Tips

1. Check browser console for service errors
2. Verify `assessmentId` is passed to component
3. Ensure authentication tokens are valid
4. Check network tab for API call details
5. Verify backend endpoints match URL paths

---

## Support

📝 Full documentation: `src/api/PLAGIARISM_IMPLEMENTATION.md`
📋 Setup summary: `PLAGIARISM_SETUP_SUMMARY.md`
🔧 Service file: `src/api/plagiarismService.ts`
🎨 Component: `src/app/organizer/new-assessment/components/AssessmentSetup.tsx`
