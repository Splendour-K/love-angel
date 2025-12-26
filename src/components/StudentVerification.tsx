import { useState, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { 
  Upload, 
  Camera, 
  CheckCircle, 
  AlertCircle, 
  FileImage, 
  IdCard, 
  School,
  Shield,
  Eye,
  EyeOff
} from 'lucide-react';

interface VerificationStep {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  required: boolean;
}

interface StudentVerificationProps {
  onComplete: (verificationData: any) => void;
  onSkip?: () => void;
}

export function StudentVerification({ onComplete, onSkip }: StudentVerificationProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [studentIdFile, setStudentIdFile] = useState<File | null>(null);
  const [transcriptFile, setTranscriptFile] = useState<File | null>(null);
  const [studentNumber, setStudentNumber] = useState('');
  const [graduationYear, setGraduationYear] = useState('');
  const [isPrivacyMode, setIsPrivacyMode] = useState(true);
  
  const studentIdRef = useRef<HTMLInputElement>(null);
  const transcriptRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const steps: VerificationStep[] = [
    {
      id: 'student_id',
      title: 'Student ID Upload',
      description: 'Upload a clear photo of your student ID card',
      completed: !!studentIdFile,
      required: true
    },
    {
      id: 'student_info',
      title: 'Student Information',
      description: 'Provide your student number and graduation year',
      completed: !!(studentNumber && graduationYear),
      required: true
    },
    {
      id: 'transcript',
      title: 'Academic Verification (Optional)',
      description: 'Upload unofficial transcript for additional verification',
      completed: !!transcriptFile,
      required: false
    }
  ];

  const handleFileUpload = (file: File, type: 'student_id' | 'transcript') => {
    if (file.size > 5 * 1024 * 1024) { // 5MB limit
      toast({
        variant: 'destructive',
        title: 'File too large',
        description: 'Please upload a file smaller than 5MB',
      });
      return;
    }

    const allowedTypes = ['image/jpeg', 'image/png', 'image/jpg', 'application/pdf'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        variant: 'destructive',
        title: 'Invalid file type',
        description: 'Please upload a JPEG, PNG, or PDF file',
      });
      return;
    }

    if (type === 'student_id') {
      setStudentIdFile(file);
    } else {
      setTranscriptFile(file);
    }

    toast({
      title: 'File uploaded',
      description: `${file.name} uploaded successfully`,
    });
  };

  const handleComplete = async () => {
    setLoading(true);
    
    try {
      // Simulate API call for verification
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      const verificationData = {
        studentIdFile,
        transcriptFile,
        studentNumber,
        graduationYear,
        privacyMode: isPrivacyMode,
        verificationLevel: transcriptFile ? 'high' : 'standard',
        timestamp: new Date().toISOString()
      };

      onComplete(verificationData);
      
      toast({
        title: 'Verification submitted',
        description: 'Your documents are being reviewed. You can start using the app while we verify.',
      });
    } catch (error) {
      toast({
        variant: 'destructive',
        title: 'Verification failed',
        description: 'Please try again or contact support.',
      });
    } finally {
      setLoading(false);
    }
  };

  const canProceed = steps.filter(step => step.required).every(step => step.completed);

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Privacy Notice */}
      <Card className="border-blue-200 bg-blue-50">
        <CardContent className="pt-6">
          <div className="flex items-start gap-3">
            <Shield className="w-5 h-5 text-blue-600 mt-0.5" />
            <div className="flex-1">
              <h4 className="font-semibold text-blue-900">Privacy & Security</h4>
              <p className="text-sm text-blue-700 mt-1">
                Your verification documents are encrypted and only used for identity verification. 
                We never share your personal documents with other users.
              </p>
              <div className="flex items-center gap-2 mt-2">
                <button
                  onClick={() => setIsPrivacyMode(!isPrivacyMode)}
                  className="flex items-center gap-2 text-sm text-blue-600 hover:text-blue-800"
                >
                  {isPrivacyMode ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  {isPrivacyMode ? 'Show verification details' : 'Hide verification details'}
                </button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Progress Steps */}
      <div className="flex justify-between items-center">
        {steps.map((step, index) => (
          <div key={step.id} className="flex flex-col items-center flex-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center ${
              step.completed 
                ? 'bg-green-500 text-white' 
                : index === currentStep 
                  ? 'bg-primary text-primary-foreground'
                  : 'bg-muted text-muted-foreground'
            }`}>
              {step.completed ? (
                <CheckCircle className="w-4 h-4" />
              ) : (
                <span className="text-sm">{index + 1}</span>
              )}
            </div>
            <div className="text-center mt-2">
              <p className="text-xs font-medium">{step.title}</p>
              {!step.required && (
                <Badge variant="secondary" className="text-xs mt-1">Optional</Badge>
              )}
            </div>
            {index < steps.length - 1 && (
              <div className="w-full h-px bg-border mt-4" />
            )}
          </div>
        ))}
      </div>

      {/* Current Step Content */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            {currentStep === 0 && <IdCard className="w-5 h-5" />}
            {currentStep === 1 && <School className="w-5 h-5" />}
            {currentStep === 2 && <FileImage className="w-5 h-5" />}
            {steps[currentStep].title}
          </CardTitle>
          <CardDescription>{steps[currentStep].description}</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {currentStep === 0 && (
            <div className="space-y-4">
              <div 
                onClick={() => studentIdRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  {studentIdFile ? (
                    <>
                      <FileImage className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700">{studentIdFile.name}</p>
                        <p className="text-sm text-muted-foreground">Click to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Upload Student ID</p>
                        <p className="text-sm text-muted-foreground">
                          JPG, PNG, or PDF up to 5MB
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <input
                ref={studentIdRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'student_id');
                }}
              />

              <div className="bg-amber-50 border border-amber-200 rounded-lg p-3">
                <p className="text-sm text-amber-800">
                  <strong>Tips for best results:</strong>
                  <br />
                  • Ensure all text is clearly visible
                  • Take photo in good lighting
                  • Cover sensitive information if needed (we only need name and university)
                </p>
              </div>
            </div>
          )}

          {currentStep === 1 && (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="studentNumber">Student Number/ID</Label>
                  <Input
                    id="studentNumber"
                    placeholder="e.g., 202012345"
                    value={studentNumber}
                    onChange={(e) => setStudentNumber(e.target.value)}
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="graduationYear">Expected Graduation</Label>
                  <Input
                    id="graduationYear"
                    type="number"
                    min={new Date().getFullYear()}
                    max={new Date().getFullYear() + 10}
                    placeholder="2025"
                    value={graduationYear}
                    onChange={(e) => setGraduationYear(e.target.value)}
                  />
                </div>
              </div>

              <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                <p className="text-sm text-blue-800">
                  This information helps us verify you're a current student and prevents duplicate accounts.
                </p>
              </div>
            </div>
          )}

          {currentStep === 2 && (
            <div className="space-y-4">
              <div 
                onClick={() => transcriptRef.current?.click()}
                className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-8 text-center cursor-pointer hover:border-primary/50 transition-colors"
              >
                <div className="flex flex-col items-center gap-3">
                  {transcriptFile ? (
                    <>
                      <FileImage className="w-8 h-8 text-green-500" />
                      <div>
                        <p className="font-medium text-green-700">{transcriptFile.name}</p>
                        <p className="text-sm text-muted-foreground">Click to replace</p>
                      </div>
                    </>
                  ) : (
                    <>
                      <Upload className="w-8 h-8 text-muted-foreground" />
                      <div>
                        <p className="font-medium">Upload Transcript (Optional)</p>
                        <p className="text-sm text-muted-foreground">
                          Unofficial transcript for enhanced verification
                        </p>
                      </div>
                    </>
                  )}
                </div>
              </div>
              
              <input
                ref={transcriptRef}
                type="file"
                accept="image/*,.pdf"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file, 'transcript');
                }}
              />

              <div className="bg-green-50 border border-green-200 rounded-lg p-3">
                <p className="text-sm text-green-800">
                  <strong>Optional but recommended:</strong> Adding a transcript increases your verification level and helps build trust with other students.
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Navigation */}
      <div className="flex justify-between">
        <div className="flex gap-2">
          {currentStep > 0 && (
            <Button 
              variant="outline" 
              onClick={() => setCurrentStep(currentStep - 1)}
            >
              Previous
            </Button>
          )}
        </div>
        
        <div className="flex gap-2">
          {onSkip && (
            <Button variant="ghost" onClick={onSkip}>
              Skip for Now
            </Button>
          )}
          
          {currentStep < steps.length - 1 ? (
            <Button 
              onClick={() => setCurrentStep(currentStep + 1)}
              disabled={!steps[currentStep].completed && steps[currentStep].required}
            >
              Next
            </Button>
          ) : (
            <Button 
              onClick={handleComplete}
              disabled={!canProceed || loading}
            >
              {loading ? 'Submitting...' : 'Complete Verification'}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}