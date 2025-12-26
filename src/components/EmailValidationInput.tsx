import { useState, useEffect } from 'react';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { validateUniversityEmail, getUniversityInfo, getDomainSuggestions, UniversityValidationResult } from '@/lib/universityValidation';
import { Mail, CheckCircle, AlertCircle, Globe, School } from 'lucide-react';

interface EmailValidationInputProps {
  value: string;
  onChange: (value: string) => void;
  error?: string;
  onValidationChange?: (isValid: boolean, validation: UniversityValidationResult | null) => void;
}

export function EmailValidationInput({ 
  value, 
  onChange, 
  error, 
  onValidationChange 
}: EmailValidationInputProps) {
  const [validation, setValidation] = useState<UniversityValidationResult | null>(null);
  const [universityInfo, setUniversityInfo] = useState<{ name?: string; country?: string } | null>(null);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (value && value.includes('@')) {
      const result = validateUniversityEmail(value);
      setValidation(result);
      
      if (result.isValid) {
        const info = getUniversityInfo(value);
        setUniversityInfo(info);
        setShowSuggestions(false);
      } else {
        setUniversityInfo(null);
        // Show suggestions for incomplete emails
        const domainSuggestions = getDomainSuggestions(value);
        setSuggestions(domainSuggestions);
        setShowSuggestions(domainSuggestions.length > 0);
      }

      onValidationChange?.(result.isValid, result);
    } else {
      setValidation(null);
      setUniversityInfo(null);
      setShowSuggestions(false);
      onValidationChange?.(false, null);
    }
  }, [value, onValidationChange]);

  const getValidationIcon = () => {
    if (!validation) return <Mail className="w-5 h-5 text-muted-foreground" />;
    return validation.isValid 
      ? <CheckCircle className="w-5 h-5 text-green-500" />
      : <AlertCircle className="w-5 h-5 text-red-500" />;
  };

  const getValidationColor = () => {
    if (!validation) return 'border-border';
    return validation.isValid 
      ? 'border-green-500 focus:border-green-500' 
      : 'border-red-500 focus:border-red-500';
  };

  return (
    <div className="space-y-2">
      <Label htmlFor="email" className="flex items-center gap-2">
        <School className="w-4 h-4" />
        University Email
      </Label>
      
      <div className="relative">
        <div className={`relative border rounded-lg transition-colors ${getValidationColor()}`}>
          <Input
            id="email"
            type="email"
            placeholder="student@university.edu"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            className={`pl-12 border-0 focus-visible:ring-0 ${error ? 'border-red-500' : ''}`}
          />
          <div className="absolute left-3 top-1/2 -translate-y-1/2">
            {getValidationIcon()}
          </div>
        </div>
        
        {validation && (
          <div className="mt-2 space-y-2">
            <div className="flex items-center gap-2">
              <Badge 
                variant={validation.isValid ? "default" : "destructive"}
                className="text-xs"
              >
                {validation.confidence} confidence
              </Badge>
              {validation.country && (
                <Badge variant="outline" className="text-xs flex items-center gap-1">
                  <Globe className="w-3 h-3" />
                  {validation.country.toUpperCase()}
                </Badge>
              )}
            </div>
            
            <p className={`text-xs ${validation.isValid ? 'text-green-600' : 'text-red-600'}`}>
              {validation.reason}
            </p>
            
            {universityInfo && (
              <div className="bg-green-50 border border-green-200 rounded-lg p-2">
                <p className="text-sm font-medium text-green-800">{universityInfo.name}</p>
                {universityInfo.country && (
                  <p className="text-xs text-green-600">{universityInfo.country}</p>
                )}
              </div>
            )}
          </div>
        )}

        {showSuggestions && suggestions.length > 0 && (
          <div className="mt-2 bg-card border rounded-lg p-3 shadow-sm">
            <p className="text-sm font-medium mb-2">Did you mean:</p>
            <div className="space-y-1">
              {suggestions.slice(0, 3).map((suggestion, index) => (
                <button
                  key={index}
                  type="button"
                  onClick={() => onChange(suggestion)}
                  className="block w-full text-left text-sm text-primary hover:text-primary/80 hover:underline"
                >
                  {suggestion}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
      
      {error && <p className="text-sm text-red-600">{error}</p>}
      
      <div className="text-xs text-muted-foreground">
        We support university emails from around the world including .edu, .ac.uk, .edu.au, and many others.
      </div>
    </div>
  );
}