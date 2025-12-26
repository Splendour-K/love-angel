import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import {
  Search,
  Filter,
  CheckCircle,
  XCircle,
  Eye,
  User,
  Calendar,
  RefreshCw,
  FileText,
  Shield,
  Clock,
} from 'lucide-react';

interface Verification {
  id: string;
  user_id: string;
  document_type: string;
  document_url: string;
  document_back_url: string | null;
  selfie_url: string | null;
  status: 'pending' | 'approved' | 'rejected' | 'expired';
  rejection_reason: string | null;
  created_at: string;
  reviewed_at: string | null;
  user?: {
    display_name: string;
    email: string;
    photos: string[];
  };
}

export default function AdminVerifications() {
  const [verifications, setVerifications] = useState<Verification[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('pending');
  const [selectedVerification, setSelectedVerification] = useState<Verification | null>(null);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');

  const { adminUser } = useAdminAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchVerifications();
  }, [filterStatus]);

  const fetchVerifications = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from('user_verifications')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;

      if (error) throw error;

      // Fetch user profiles
      const userIds = [...new Set(data?.map(v => v.user_id) || [])];
      
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name, email, photos')
        .in('user_id', userIds);

      const profileMap = new Map(profiles?.map(p => [p.user_id, p]));

      const verificationsWithProfiles = data?.map(v => ({
        ...v,
        status: v.status as 'pending' | 'approved' | 'rejected' | 'expired',
        user: profileMap.get(v.user_id),
      })) || [];

      setVerifications(verificationsWithProfiles);
    } catch (err) {
      console.error('Error fetching verifications:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to fetch verifications.',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async (verification: Verification) => {
    try {
      const { error } = await supabase
        .from('user_verifications')
        .update({
          status: 'approved',
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', verification.id);

      if (error) throw error;

      // Log audit action
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'approve_verification',
        target_type: 'user_verification',
        target_id: verification.id,
        details: { user_id: verification.user_id },
      });

      toast({
        title: 'Verification approved',
        description: 'The user has been verified successfully.',
      });

      setViewDialogOpen(false);
      fetchVerifications();
    } catch (err) {
      console.error('Error approving verification:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to approve verification.',
      });
    }
  };

  const handleReject = async () => {
    if (!selectedVerification || !rejectionReason) return;

    try {
      const { error } = await supabase
        .from('user_verifications')
        .update({
          status: 'rejected',
          rejection_reason: rejectionReason,
          reviewed_by: adminUser?.id,
          reviewed_at: new Date().toISOString(),
        })
        .eq('id', selectedVerification.id);

      if (error) throw error;

      // Log audit action
      await supabase.from('admin_audit_log').insert({
        admin_id: adminUser?.id,
        action: 'reject_verification',
        target_type: 'user_verification',
        target_id: selectedVerification.id,
        details: { 
          user_id: selectedVerification.user_id,
          reason: rejectionReason,
        },
      });

      toast({
        title: 'Verification rejected',
        description: 'The user has been notified of the rejection.',
      });

      setRejectDialogOpen(false);
      setViewDialogOpen(false);
      setRejectionReason('');
      fetchVerifications();
    } catch (err) {
      console.error('Error rejecting verification:', err);
      toast({
        variant: 'destructive',
        title: 'Error',
        description: 'Failed to reject verification.',
      });
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getDocumentTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      student_id: 'Student ID',
      government_id: 'Government ID',
      passport: 'Passport',
      drivers_license: "Driver's License",
    };
    return labels[type] || type;
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <span className="px-2 py-1 bg-yellow-500/20 text-yellow-400 rounded-full text-xs">Pending</span>;
      case 'approved':
        return <span className="px-2 py-1 bg-green-500/20 text-green-400 rounded-full text-xs">Approved</span>;
      case 'rejected':
        return <span className="px-2 py-1 bg-red-500/20 text-red-400 rounded-full text-xs">Rejected</span>;
      case 'expired':
        return <span className="px-2 py-1 bg-slate-500/20 text-slate-400 rounded-full text-xs">Expired</span>;
      default:
        return null;
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-white">User Verifications</h1>
          <p className="text-slate-400">Review and approve user ID submissions.</p>
        </div>
        <Button onClick={fetchVerifications} variant="outline" className="border-slate-600 text-slate-300 hover:bg-slate-700">
          <RefreshCw className="w-4 h-4 mr-2" />
          Refresh
        </Button>
      </div>

      {/* Filters */}
      <div className="bg-slate-800 rounded-xl p-4 border border-slate-700 mb-6">
        <div className="flex flex-wrap gap-4">
          <div className="flex-1 min-w-64">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <Input
                placeholder="Search by user..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-slate-700 border-slate-600 text-white placeholder:text-slate-400"
              />
            </div>
          </div>
          <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
            <SelectTrigger className="w-48 bg-slate-700 border-slate-600 text-white">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="Filter" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Verifications</SelectItem>
              <SelectItem value="pending">Pending</SelectItem>
              <SelectItem value="approved">Approved</SelectItem>
              <SelectItem value="rejected">Rejected</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {[
          { label: 'Pending', count: verifications.filter(v => v.status === 'pending').length, color: 'yellow', icon: Clock },
          { label: 'Approved', count: verifications.filter(v => v.status === 'approved').length, color: 'green', icon: CheckCircle },
          { label: 'Rejected', count: verifications.filter(v => v.status === 'rejected').length, color: 'red', icon: XCircle },
          { label: 'Total', count: verifications.length, color: 'blue', icon: Shield },
        ].map((stat) => (
          <div key={stat.label} className="bg-slate-800 rounded-xl p-4 border border-slate-700">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                stat.color === 'yellow' ? 'bg-yellow-500/20 text-yellow-400' :
                stat.color === 'green' ? 'bg-green-500/20 text-green-400' :
                stat.color === 'red' ? 'bg-red-500/20 text-red-400' :
                'bg-blue-500/20 text-blue-400'
              }`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{stat.count}</p>
                <p className="text-sm text-slate-400">{stat.label}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Verifications List */}
      <div className="bg-slate-800 rounded-xl border border-slate-700">
        {loading ? (
          <div className="p-8 text-center text-slate-400">Loading verifications...</div>
        ) : verifications.length === 0 ? (
          <div className="p-8 text-center text-slate-400">No verifications found.</div>
        ) : (
          <div className="divide-y divide-slate-700">
            {verifications.map((verification) => (
              <div key={verification.id} className="p-4 hover:bg-slate-700/50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-slate-600 overflow-hidden">
                      {verification.user?.photos?.[0] ? (
                        <img
                          src={verification.user.photos[0]}
                          alt=""
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <User className="w-6 h-6 text-slate-400" />
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="text-white font-medium">
                        {verification.user?.display_name || 'Unknown User'}
                      </p>
                      <p className="text-slate-400 text-sm">{verification.user?.email}</p>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <FileText className="w-3 h-3" />
                          {getDocumentTypeLabel(verification.document_type)}
                        </span>
                        <span className="text-xs text-slate-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          {formatDate(verification.created_at)}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {getStatusBadge(verification.status)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        setSelectedVerification(verification);
                        setViewDialogOpen(true);
                      }}
                      className="border-slate-600 text-slate-300 hover:bg-slate-700"
                    >
                      <Eye className="w-4 h-4 mr-1" />
                      Review
                    </Button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* View/Review Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Review Verification</DialogTitle>
            <DialogDescription className="text-slate-400">
              Review the submitted documents and approve or reject the verification.
            </DialogDescription>
          </DialogHeader>

          {selectedVerification && (
            <div className="space-y-6">
              {/* User Info */}
              <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-lg">
                <div className="w-16 h-16 rounded-full bg-slate-600 overflow-hidden">
                  {selectedVerification.user?.photos?.[0] ? (
                    <img
                      src={selectedVerification.user.photos[0]}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-8 h-8 text-slate-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-white font-medium text-lg">
                    {selectedVerification.user?.display_name}
                  </p>
                  <p className="text-slate-400">{selectedVerification.user?.email}</p>
                  <p className="text-sm text-slate-500">
                    Submitted: {formatDate(selectedVerification.created_at)}
                  </p>
                </div>
                <div className="ml-auto">
                  {getStatusBadge(selectedVerification.status)}
                </div>
              </div>

              {/* Document Images */}
              <div>
                <h4 className="text-white font-medium mb-3">
                  {getDocumentTypeLabel(selectedVerification.document_type)}
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm text-slate-400 mb-2">Front</p>
                    <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden">
                      {selectedVerification.document_url ? (
                        <img
                          src={selectedVerification.document_url}
                          alt="Document front"
                          className="w-full h-full object-contain"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-slate-500">
                          No image
                        </div>
                      )}
                    </div>
                  </div>
                  {selectedVerification.document_back_url && (
                    <div>
                      <p className="text-sm text-slate-400 mb-2">Back</p>
                      <div className="aspect-video bg-slate-700 rounded-lg overflow-hidden">
                        <img
                          src={selectedVerification.document_back_url}
                          alt="Document back"
                          className="w-full h-full object-contain"
                        />
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Selfie if provided */}
              {selectedVerification.selfie_url && (
                <div>
                  <p className="text-sm text-slate-400 mb-2">Selfie Verification</p>
                  <div className="w-32 h-32 bg-slate-700 rounded-lg overflow-hidden">
                    <img
                      src={selectedVerification.selfie_url}
                      alt="Selfie"
                      className="w-full h-full object-cover"
                    />
                  </div>
                </div>
              )}

              {/* Rejection reason if rejected */}
              {selectedVerification.rejection_reason && (
                <div className="p-4 bg-red-500/10 border border-red-500/30 rounded-lg">
                  <p className="text-red-400 font-medium">Rejection Reason:</p>
                  <p className="text-slate-300 mt-1">{selectedVerification.rejection_reason}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter className="gap-2">
            {selectedVerification?.status === 'pending' && (
              <>
                <Button
                  variant="outline"
                  onClick={() => setRejectDialogOpen(true)}
                  className="border-red-500 text-red-400 hover:bg-red-500/20"
                >
                  <XCircle className="w-4 h-4 mr-2" />
                  Reject
                </Button>
                <Button
                  onClick={() => handleApprove(selectedVerification)}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Approve
                </Button>
              </>
            )}
            <Button
              variant="ghost"
              onClick={() => setViewDialogOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Reject Dialog */}
      <Dialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <DialogContent className="bg-slate-800 border-slate-700">
          <DialogHeader>
            <DialogTitle className="text-white">Reject Verification</DialogTitle>
            <DialogDescription className="text-slate-400">
              Please provide a reason for rejection. This will be shared with the user.
            </DialogDescription>
          </DialogHeader>

          <Textarea
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            placeholder="Enter rejection reason..."
            className="bg-slate-700 border-slate-600 text-white placeholder:text-slate-400 min-h-24"
          />

          <DialogFooter>
            <Button
              variant="ghost"
              onClick={() => setRejectDialogOpen(false)}
              className="text-slate-400 hover:text-white"
            >
              Cancel
            </Button>
            <Button
              onClick={handleReject}
              disabled={!rejectionReason}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Confirm Rejection
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
