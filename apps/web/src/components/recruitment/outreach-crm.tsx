'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Progress } from '@/components/ui/progress';
import { 
  Plus,
  Send,
  Eye,
  MessageSquare,
  TrendingUp,
  Users,
  Mail,
  Calendar,
  Edit,
  Trash2,
  Play,
  Pause,
  BarChart3
} from 'lucide-react';

interface OutreachCampaign {
  id: string;
  name: string;
  jobPostingTitle: string;
  status: 'draft' | 'active' | 'paused' | 'completed';
  templateName: string;
  totalCandidates: number;
  messagesSent: number;
  responsesReceived: number;
  createdAt: string;
  updatedAt: string;
}

interface MessageTemplate {
  id: string;
  name: string;
  subject: string;
  content: string;
  type: 'initial' | 'follow_up' | 'interview_invite';
  isActive: boolean;
  createdAt: string;
}

interface OutreachActivity {
  id: string;
  candidateName: string;
  subject: string;
  status: 'pending' | 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied';
  sentAt?: string;
  openedAt?: string;
  repliedAt?: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  icon: React.ReactNode;
  trend?: {
    value: number;
    isPositive: boolean;
  };
}

function MetricCard({ title, value, icon, trend }: MetricCardProps) {
  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {trend && (
              <div className={`flex items-center text-sm ${trend.isPositive ? 'text-green-600' : 'text-red-600'}`}>
                <TrendingUp className="w-4 h-4 mr-1" />
                {trend.isPositive ? '+' : ''}{trend.value}%
              </div>
            )}
          </div>
          <div className="text-muted-foreground">
            {icon}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function CampaignsList() {
  const mockCampaigns: OutreachCampaign[] = [
    {
      id: '1',
      name: 'Senior Developer Outreach Q1',
      jobPostingTitle: 'Senior Full Stack Developer',
      status: 'active',
      templateName: 'Initial Contact - Tech Role',
      totalCandidates: 45,
      messagesSent: 32,
      responsesReceived: 8,
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-20T15:30:00Z'
    },
    {
      id: '2',
      name: 'Frontend Specialist Campaign',
      jobPostingTitle: 'React Frontend Developer',
      status: 'paused',
      templateName: 'Frontend Expert Invitation',
      totalCandidates: 28,
      messagesSent: 28,
      responsesReceived: 12,
      createdAt: '2024-01-10T09:00:00Z',
      updatedAt: '2024-01-18T11:20:00Z'
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'completed': return 'outline';
      default: return 'outline';
    }
  };

  const getResponseRate = (sent: number, responses: number) => {
    return sent > 0 ? Math.round((responses / sent) * 100) : 0;
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Active Campaigns</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Campaign
        </Button>
      </div>

      <div className="grid gap-4">
        {mockCampaigns.map((campaign) => (
          <Card key={campaign.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold">{campaign.name}</h4>
                  <p className="text-sm text-muted-foreground">{campaign.jobPostingTitle}</p>
                  <p className="text-xs text-muted-foreground">Template: {campaign.templateName}</p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={getStatusBadgeVariant(campaign.status)}>
                    {campaign.status.charAt(0).toUpperCase() + campaign.status.slice(1)}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-4 gap-4 mb-4">
                <div className="text-center">
                  <p className="text-2xl font-bold">{campaign.totalCandidates}</p>
                  <p className="text-xs text-muted-foreground">Total Candidates</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">{campaign.messagesSent}</p>
                  <p className="text-xs text-muted-foreground">Messages Sent</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">{campaign.responsesReceived}</p>
                  <p className="text-xs text-muted-foreground">Responses</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {getResponseRate(campaign.messagesSent, campaign.responsesReceived)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
              </div>

              <div className="mb-4">
                <div className="flex justify-between text-sm mb-1">
                  <span>Campaign Progress</span>
                  <span>{campaign.messagesSent}/{campaign.totalCandidates}</span>
                </div>
                <Progress value={(campaign.messagesSent / campaign.totalCandidates) * 100} />
              </div>

              <div className="flex justify-between items-center">
                <p className="text-xs text-muted-foreground">
                  Updated {new Date(campaign.updatedAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  {campaign.status === 'active' ? (
                    <Button variant="outline" size="sm">
                      <Pause className="w-4 h-4 mr-1" />
                      Pause
                    </Button>
                  ) : (
                    <Button variant="outline" size="sm">
                      <Play className="w-4 h-4 mr-1" />
                      Resume
                    </Button>
                  )}
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View Details
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function TemplateManager() {
  const mockTemplates: MessageTemplate[] = [
    {
      id: '1',
      name: 'Initial Contact - Tech Role',
      subject: 'Exciting opportunity at {company_name}',
      content: `Hi {candidate_name},

I came across your profile and was impressed by your work on {top_project}. We have an exciting {job_title} position at {company_name} that seems like a perfect match for your skills in {top_skills}.

Key highlights:
- Competitive salary: {salary_range}
- Remote-first culture
- Cutting-edge tech stack
- Strong growth opportunities

Would you be interested in learning more? I'd love to schedule a brief chat to discuss this opportunity.

Best regards,
{recruiter_name}`,
      type: 'initial',
      isActive: true,
      createdAt: '2024-01-10T09:00:00Z'
    },
    {
      id: '2',
      name: 'Follow-up - Tech Interest',
      subject: 'Following up on {job_title} opportunity',
      content: `Hi {candidate_name},

I wanted to follow up on the {job_title} position I mentioned earlier. I understand you might be busy, but I believe this role could be a great next step in your career.

The team is particularly excited about candidates with your background in {primary_skill}. Would you have 15 minutes this week for a quick call?

Looking forward to hearing from you!

{recruiter_name}`,
      type: 'follow_up',
      isActive: true,
      createdAt: '2024-01-12T14:30:00Z'
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Message Templates</h3>
        <Button>
          <Plus className="w-4 h-4 mr-2" />
          New Template
        </Button>
      </div>

      <div className="grid gap-4">
        {mockTemplates.map((template) => (
          <Card key={template.id}>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h4 className="font-semibold">{template.name}</h4>
                  <p className="text-sm text-muted-foreground">Subject: {template.subject}</p>
                  <Badge variant="outline" className="mt-2">
                    {template.type.replace('_', ' ').toUpperCase()}
                  </Badge>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant={template.isActive ? 'default' : 'secondary'}>
                    {template.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                  <Button variant="ghost" size="sm">
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>

              <div className="bg-muted/30 p-4 rounded-lg">
                <p className="text-sm whitespace-pre-line">
                  {template.content.substring(0, 200)}
                  {template.content.length > 200 && '...'}
                </p>
              </div>

              <div className="flex justify-between items-center mt-4">
                <p className="text-xs text-muted-foreground">
                  Created {new Date(template.createdAt).toLocaleDateString()}
                </p>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    Preview
                  </Button>
                  <Button variant="outline" size="sm">
                    Test Send
                  </Button>
                  <Button size="sm">
                    Use Template
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function OutreachAnalytics() {
  const mockAnalytics = {
    totalSent: 284,
    totalDelivered: 276,
    totalOpened: 158,
    totalClicked: 45,
    totalReplied: 32,
    avgResponseTime: '2.3 days',
    bestPerformingTemplate: 'Initial Contact - Tech Role',
    peakOpenTime: '10:00 AM',
    campaignComparison: [
      { name: 'Senior Dev Campaign', sent: 120, responses: 18, rate: 15 },
      { name: 'Frontend Specialist', sent: 89, responses: 12, rate: 13.5 },
      { name: 'Backend Engineer', sent: 75, responses: 8, rate: 10.7 }
    ]
  };

  const deliveryRate = Math.round((mockAnalytics.totalDelivered / mockAnalytics.totalSent) * 100);
  const openRate = Math.round((mockAnalytics.totalOpened / mockAnalytics.totalDelivered) * 100);
  const clickRate = Math.round((mockAnalytics.totalClicked / mockAnalytics.totalOpened) * 100);
  const replyRate = Math.round((mockAnalytics.totalReplied / mockAnalytics.totalSent) * 100);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">Outreach Analytics</h3>
      
      {/* Key Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <MetricCard
          title="Delivery Rate"
          value={`${deliveryRate}%`}
          icon={<Send className="w-5 h-5" />}
          trend={{ value: 2.1, isPositive: true }}
        />
        <MetricCard
          title="Open Rate"
          value={`${openRate}%`}
          icon={<Eye className="w-5 h-5" />}
          trend={{ value: 1.8, isPositive: true }}
        />
        <MetricCard
          title="Click Rate"
          value={`${clickRate}%`}
          icon={<MessageSquare className="w-5 h-5" />}
          trend={{ value: 0.5, isPositive: false }}
        />
        <MetricCard
          title="Reply Rate"
          value={`${replyRate}%`}
          icon={<Mail className="w-5 h-5" />}
          trend={{ value: 3.2, isPositive: true }}
        />
      </div>

      {/* Campaign Performance */}
      <Card>
        <CardHeader>
          <CardTitle>Campaign Performance Comparison</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {mockAnalytics.campaignComparison.map((campaign, index) => (
              <div key={index} className="flex items-center justify-between p-4 border rounded-lg">
                <div>
                  <h4 className="font-medium">{campaign.name}</h4>
                  <p className="text-sm text-muted-foreground">
                    {campaign.sent} sent • {campaign.responses} responses
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-lg font-bold">{campaign.rate}%</p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Insights */}
      <Card>
        <CardHeader>
          <CardTitle>Key Insights</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-start gap-3 p-4 bg-blue-50 rounded-lg">
            <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900">Best Performing Template</h4>
              <p className="text-sm text-blue-700">
                "{mockAnalytics.bestPerformingTemplate}" has a 15% response rate
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-green-50 rounded-lg">
            <Calendar className="w-5 h-5 text-green-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-green-900">Optimal Timing</h4>
              <p className="text-sm text-green-700">
                Messages sent at {mockAnalytics.peakOpenTime} get 23% more opens
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3 p-4 bg-purple-50 rounded-lg">
            <MessageSquare className="w-5 h-5 text-purple-600 mt-0.5" />
            <div>
              <h4 className="font-medium text-purple-900">Response Time</h4>
              <p className="text-sm text-purple-700">
                Average response time: {mockAnalytics.avgResponseTime}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function OutreachCRM() {
  return (
    <div className="space-y-6">
      {/* Overview Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <MetricCard
          title="Active Campaigns"
          value="12"
          icon={<Send className="w-5 h-5" />}
          trend={{ value: 2, isPositive: true }}
        />
        <MetricCard
          title="Messages Sent"
          value="284"
          icon={<Mail className="w-5 h-5" />}
          trend={{ value: 15, isPositive: true }}
        />
        <MetricCard
          title="Response Rate"
          value="23%"
          icon={<MessageSquare className="w-5 h-5" />}
          trend={{ value: 5, isPositive: true }}
        />
        <MetricCard
          title="Interviews Scheduled"
          value="8"
          icon={<Calendar className="w-5 h-5" />}
          trend={{ value: 12, isPositive: true }}
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="campaigns" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="campaigns">Campaigns</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="campaigns" className="space-y-6">
          <CampaignsList />
        </TabsContent>
        
        <TabsContent value="templates" className="space-y-6">
          <TemplateManager />
        </TabsContent>
        
        <TabsContent value="analytics" className="space-y-6">
          <OutreachAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}