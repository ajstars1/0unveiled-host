"use client"

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from '@/hooks/use-toast';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Loader2, Check, X } from "lucide-react"
import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { applicationStatusEnum } from "@0unveiled/database/schema";
import { getApplicationsForProject, projectPositionApplicationUpdate } from '@/actions/project';

interface ListApplicantsProps {
    projectId: string;
}

interface ApplicationData {
    id: string;
    userId: string;
    projectId: string;
    projectRoleId: string | null;
    user: {
        id: string;
        username: string | null;
        profilePicture: string | null;
        headline: string | null;
    };
    projectRole: {
        id: string;
        title: string;
    } | null;
    message: string | null;
    status: ApplicationStatus;
    submittedAt: string;
    reviewedAt: string | null;
}

const getBadgeVariant = (status: ApplicationStatus): 'default' | 'secondary' | 'destructive' | 'outline-solid' => {
    switch (status) {
        case 'ACCEPTED': return 'default';
        case 'PENDING': return 'secondary';
        case 'REJECTED': return 'destructive';
        default: return 'secondary';
    }
}

export default function ListApplicants({ projectId }: ListApplicantsProps) {
    const queryClient = useQueryClient();

    const { data: queryResult, isLoading, error } = useQuery({
        queryKey: ['projectApplications', projectId],
        queryFn: () => getApplicationsForProject(projectId),
    });

    const applications = queryResult?.success ? queryResult.data as ApplicationData[] : [];
    const fetchError = queryResult?.error;

    const { mutate: updateApplication, isPending: isUpdating } = useMutation({ 
        mutationFn: (variables: { applicationId: string, status: ApplicationStatus }) => 
                       projectPositionApplicationUpdate(variables.applicationId, variables.status), 
        onSuccess: (data, variables) => {
            if (data.success) {
                toast({ title: 'Success', description: `Application status updated.` });
                queryClient.invalidateQueries({ queryKey: ['projectApplications', projectId] });
                if (variables.status === 'ACCEPTED') {
                    queryClient.invalidateQueries({ queryKey: ['projectDetails', projectId, 'members'] });
                    queryClient.invalidateQueries({ queryKey: ['projectById', projectId] });
                }
            } else {
                 toast({ title: 'Error', description: data.error || `Failed to update status.`, variant: 'destructive' });
            }
        },
        onError: (error: any) => {
             toast({ title: 'Error', description: error.message || 'Failed to update status.', variant: 'destructive' });
        }
    });

    const handleUpdateStatus = (applicationId: string, status: ApplicationStatus) => {
        updateApplication({ applicationId, status });
    };

    if (isLoading) {
        return (
            <div className="flex justify-center items-center p-6">
                <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
            </div>
        );
    }

    if (fetchError) {
        return <p className="text-destructive p-6">Error loading applications: {fetchError}</p>;
    }

    if (!applications || applications.length === 0) {
        return <p className="text-muted-foreground p-6 italic">No applications received yet.</p>;
    }

    return (
        <div className="space-y-4">
            {applications.map((app) => (
                <Card key={app.id} className="overflow-hidden">
                    <CardHeader className="flex flex-row items-start justify-between gap-4 bg-muted/50 p-4">
                        <div className="flex items-center gap-3">
                            <Avatar className="h-10 w-10 border">
                                <AvatarImage src={app.user.profilePicture || undefined} alt={app.user.username || 'Applicant'} />
                                <AvatarFallback>{app.user.username?.charAt(0).toUpperCase() || 'A'}</AvatarFallback>
                            </Avatar>
                            <div>
                                <Link href={`/${app.user.username}`} className="font-semibold hover:underline">
                                    {app.user.username || 'Unknown Applicant'}
                                </Link>
                                <p className="text-xs text-muted-foreground">{app.user.headline || 'No headline'}</p>
                                <p className="text-xs text-muted-foreground mt-1">
                                    Applied {new Date(app.submittedAt).toLocaleDateString()} for role: 
                                    <span className='font-medium text-foreground'> {app.projectRole?.title || 'General Application'}</span>
                                </p>
                            </div>
                        </div>
                        <Badge variant={getBadgeVariant(app.status)} className="capitalize">
                           {app.status.toLowerCase()}
                        </Badge>
                    </CardHeader>
                    <CardContent className="p-4 space-y-3">
                        {app.message && (
                             <div>
                                <p className="text-sm font-medium mb-1">Applicant&apos;s Note:</p>
                                <p className="text-sm text-muted-foreground bg-background p-3 rounded border whitespace-pre-wrap">{app.message}</p>
                            </div>
                        )}
                       
                        {app.status === 'PENDING' && (
                             <div className="flex justify-end gap-2 pt-2">
                                <Button 
                                    variant="outline" 
                                    size="sm" 
                                    onClick={() => handleUpdateStatus(app.id, 'REJECTED')}
                                    disabled={isUpdating}
                                >
                                    <X className="h-4 w-4 mr-1"/> Reject
                                </Button>
                                <Button 
                                    variant="default" 
                                    size="sm" 
                                    onClick={() => handleUpdateStatus(app.id, 'ACCEPTED')}
                                    disabled={isUpdating}
                                >
                                    <Check className="h-4 w-4 mr-1"/> Approve
                                </Button>
                            </div>
                        )}
                    </CardContent>
                </Card>
            ))}
        </div>
    );
}
