'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { 
  BarChart3,
  Users,
  Briefcase,
  TrendingUp,
  Clock,
  Mail,
  Eye,
  MessageSquare,
  CheckCircle,
  XCircle,
  Plus,
  Filter,
  Download,
  Settings,
  Zap,
  Target,
  Sparkles
} from 'lucide-react';

interface DashboardMetrics {
  totalJobPostings: number;
  activeJobPostings: number;
  totalCandidates: number;
  matchedCandidates: number;
  responsiveRate: number;
  hireRate: number;
  avgTimeToHire: string;
  topPerformingJob: string;
}

interface JobPosting {
  id: string;
  title: string;
  department: string;
  status: 'draft' | 'active' | 'paused' | 'closed';
  candidatesMatched: number;
  responsesReceived: number;
  interviewsScheduled: number;
  hires: number;
  postedDate: string;
  budget: number;
  priority: 'low' | 'medium' | 'high';
}

interface PipelineStage {
  stage: string;
  count: number;
  percentage: number;
  color: string;
}

interface MetricCardProps {
  title: string;
  value: string | number;
  change?: string;
  trend?: 'up' | 'down' | 'neutral';
  icon: React.ReactNode;
  subtitle?: string;
}

function MetricCard({ title, value, change, trend, icon, subtitle }: MetricCardProps) {
  const getTrendColor = () => {
    switch (trend) {
      case 'up': return 'text-green-600';
      case 'down': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return '↗';
      case 'down': return '↘';
      default: return '→';
    }
  };

  return (
    <Card>
      <CardContent className="p-6">
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold">{value}</p>
            {subtitle && (
              <p className="text-xs text-muted-foreground">{subtitle}</p>
            )}
            {change && (
              <div className={`flex items-center text-sm ${getTrendColor()}`}>
                <span className="mr-1">{getTrendIcon()}</span>
                {change}
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

function RecruitmentPipeline() {
  const pipelineData: PipelineStage[] = [
    { stage: 'Sourced', count: 1247, percentage: 100, color: 'bg-blue-500' },
    { stage: 'Screened', count: 892, percentage: 71, color: 'bg-indigo-500' },
    { stage: 'Interviewed', count: 234, percentage: 19, color: 'bg-purple-500' },
    { stage: 'Offered', count: 67, percentage: 5, color: 'bg-green-500' },
    { stage: 'Hired', count: 43, percentage: 3, color: 'bg-emerald-500' },
  ];

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Target className="w-5 h-5" />
          Recruitment Pipeline
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {pipelineData.map((stage, index) => (
            <div key={stage.stage} className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="font-medium">{stage.stage}</span>
                  <Badge variant="outline">{stage.count}</Badge>
                </div>
                <span className="text-sm text-muted-foreground">{stage.percentage}%</span>
              </div>
              
              <div className="relative">
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className={`${stage.color} h-2 rounded-full transition-all duration-500`}
                    style={{ width: `${stage.percentage}%` }}
                  />
                </div>
                
                {/* Funnel connector */}
                {index < pipelineData.length - 1 && (
                  <div className="flex justify-center mt-2">
                    <div className="w-0 h-0 border-l-4 border-r-4 border-t-4 border-l-transparent border-r-transparent border-t-gray-300" />
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
        
        <div className="mt-6 p-4 bg-muted/30 rounded-lg">
          <h4 className="font-semibold mb-2">Pipeline Insights</h4>
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <p className="text-muted-foreground">Conversion Rate</p>
              <p className="font-semibold">3.4%</p>
            </div>
            <div>
              <p className="text-muted-foreground">Average Time</p>
              <p className="font-semibold">23 days</p>
            </div>
            <div>
              <p className="text-muted-foreground">Drop-off Stage</p>
              <p className="font-semibold">Screening</p>
            </div>
            <div>
              <p className="text-muted-foreground">Cost per Hire</p>
              <p className="font-semibold">$3,200</p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

function JobPostingsTable() {
  const mockJobs: JobPosting[] = [
    {
      id: '1',
      title: 'Senior Full Stack Developer',
      department: 'Engineering',
      status: 'active',
      candidatesMatched: 89,
      responsesReceived: 23,
      interviewsScheduled: 8,
      hires: 1,
      postedDate: '2024-01-15',
      budget: 15000,
      priority: 'high'
    },
    {
      id: '2',
      title: 'React Frontend Developer',
      department: 'Engineering',
      status: 'active',
      candidatesMatched: 67,
      responsesReceived: 18,
      interviewsScheduled: 6,
      hires: 2,
      postedDate: '2024-01-10',
      budget: 12000,
      priority: 'medium'
    },
    {
      id: '3',
      title: 'DevOps Engineer',
      department: 'Infrastructure',
      status: 'paused',
      candidatesMatched: 34,
      responsesReceived: 9,
      interviewsScheduled: 3,
      hires: 0,
      postedDate: '2024-01-08',
      budget: 18000,
      priority: 'low'
    }
  ];

  const getStatusBadgeVariant = (status: string) => {
    switch (status) {
      case 'active': return 'default';
      case 'paused': return 'secondary';
      case 'closed': return 'outline';
      default: return 'outline';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high': return 'text-red-600';
      case 'medium': return 'text-yellow-600';
      case 'low': return 'text-green-600';
      default: return 'text-gray-600';
    }
  };

  const getResponseRate = (responses: number, matched: number) => {
    return matched > 0 ? Math.round((responses / matched) * 100) : 0;
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Briefcase className="w-5 h-5" />
            Active Job Postings
          </CardTitle>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Filter className="w-4 h-4 mr-1" />
              Filter
            </Button>
            <Button size="sm">
              <Plus className="w-4 h-4 mr-1" />
              New Job
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {mockJobs.map((job) => (
            <div key={job.id} className="p-4 border rounded-lg hover:shadow-sm transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold">{job.title}</h3>
                  <p className="text-sm text-muted-foreground">{job.department}</p>
                  <p className="text-xs text-muted-foreground">
                    Posted {new Date(job.postedDate).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={getPriorityColor(job.priority)}>
                    {job.priority.toUpperCase()}
                  </Badge>
                  <Badge variant={getStatusBadgeVariant(job.status)}>
                    {job.status.charAt(0).toUpperCase() + job.status.slice(1)}
                  </Badge>
                </div>
              </div>

              <div className="grid grid-cols-5 gap-4 mb-3 text-center">
                <div>
                  <p className="text-lg font-semibold text-blue-600">{job.candidatesMatched}</p>
                  <p className="text-xs text-muted-foreground">Matched</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-green-600">{job.responsesReceived}</p>
                  <p className="text-xs text-muted-foreground">Responded</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-purple-600">{job.interviewsScheduled}</p>
                  <p className="text-xs text-muted-foreground">Interviews</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-emerald-600">{job.hires}</p>
                  <p className="text-xs text-muted-foreground">Hires</p>
                </div>
                <div>
                  <p className="text-lg font-semibold text-orange-600">
                    {getResponseRate(job.responsesReceived, job.candidatesMatched)}%
                  </p>
                  <p className="text-xs text-muted-foreground">Response Rate</p>
                </div>
              </div>

              <div className="flex items-center justify-between">
                <div className="text-sm text-muted-foreground">
                  Budget: ${job.budget.toLocaleString()}
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" size="sm">
                    <Eye className="w-4 h-4 mr-1" />
                    View
                  </Button>
                  <Button variant="outline" size="sm">
                    <BarChart3 className="w-4 h-4 mr-1" />
                    Analytics
                  </Button>
                  <Button size="sm">
                    <Zap className="w-4 h-4 mr-1" />
                    AI Boost
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function PerformanceAnalytics() {
  const [timeRange, setTimeRange] = useState('30d');

  const performanceData = {
    sourcingEfficiency: 78,
    candidateQuality: 85,
    timeToFill: 23,
    costPerHire: 3200,
    offerAcceptanceRate: 89,
    candidateSatisfaction: 4.2
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Performance Analytics</h3>
        <div className="flex gap-2">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
              <SelectItem value="1y">Last year</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" size="sm">
            <Download className="w-4 h-4 mr-1" />
            Export
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Sourcing Efficiency</h4>
              <Sparkles className="w-4 h-4 text-blue-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{performanceData.sourcingEfficiency}%</span>
                <span className="text-sm text-green-600">+5%</span>
              </div>
              <Progress value={performanceData.sourcingEfficiency} />
              <p className="text-xs text-muted-foreground">
                AI matching vs manual sourcing effectiveness
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Candidate Quality</h4>
              <Target className="w-4 h-4 text-green-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{performanceData.candidateQuality}%</span>
                <span className="text-sm text-green-600">+8%</span>
              </div>
              <Progress value={performanceData.candidateQuality} />
              <p className="text-xs text-muted-foreground">
                Average CRUISM score of matched candidates
              </p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium">Time to Fill</h4>
              <Clock className="w-4 h-4 text-orange-500" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-2xl font-bold">{performanceData.timeToFill}d</span>
                <span className="text-sm text-green-600">-3d</span>
              </div>
              <p className="text-xs text-muted-foreground">
                Average days from posting to hire
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* AI Insights */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-purple-500" />
            AI Insights & Recommendations
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-start gap-3">
              <TrendingUp className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-blue-900">Optimize Job Descriptions</h4>
                <p className="text-sm text-blue-700">
                  Jobs with "remote-first" in the description get 34% more applications.
                  Consider updating 3 active postings.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Apply Suggestion
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Users className="w-5 h-5 text-green-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-green-900">High-Potential Candidates</h4>
                <p className="text-sm text-green-700">
                  Found 12 candidates with 90%+ match scores who haven't been contacted yet.
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Review Candidates
                </Button>
              </div>
            </div>
          </div>

          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="flex items-start gap-3">
              <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
              <div>
                <h4 className="font-medium text-yellow-900">Response Time Optimization</h4>
                <p className="text-sm text-yellow-700">
                  Candidates contacted within 24 hours have 67% higher response rates.
                  Enable auto-outreach for top matches?
                </p>
                <Button variant="outline" size="sm" className="mt-2">
                  Configure Auto-Outreach
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

export function EnterpriseRecruitmentDashboard() {
  const mockMetrics: DashboardMetrics = {
    totalJobPostings: 23,
    activeJobPostings: 12,
    totalCandidates: 1247,
    matchedCandidates: 342,
    responsiveRate: 23.5,
    hireRate: 8.2,
    avgTimeToHire: '23 days',
    topPerformingJob: 'Senior Full Stack Developer'
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Recruitment Dashboard</h1>
          <p className="text-muted-foreground">
            AI-powered hiring insights and candidate management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="w-4 h-4 mr-1" />
            Settings
          </Button>
          <Button>
            <Plus className="w-4 h-4 mr-1" />
            New Job Posting
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Active Jobs"
          value={mockMetrics.activeJobPostings}
          change="+2 this week"
          trend="up"
          icon={<Briefcase className="w-5 h-5" />}
          subtitle={`${mockMetrics.totalJobPostings} total postings`}
        />
        <MetricCard
          title="Matched Candidates"
          value={mockMetrics.matchedCandidates}
          change="+15% from last month"
          trend="up"
          icon={<Users className="w-5 h-5" />}
          subtitle={`${mockMetrics.totalCandidates} in pipeline`}
        />
        <MetricCard
          title="Response Rate"
          value={`${mockMetrics.responsiveRate}%`}
          change="+3.2% improvement"
          trend="up"
          icon={<MessageSquare className="w-5 h-5" />}
          subtitle="Above industry average"
        />
        <MetricCard
          title="Time to Hire"
          value={mockMetrics.avgTimeToHire}
          change="-5 days faster"
          trend="up"
          icon={<Clock className="w-5 h-5" />}
          subtitle="AI-optimized process"
        />
      </div>

      {/* Main Content */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="jobs">Job Postings</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="analytics">Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <RecruitmentPipeline />
            <JobPostingsTable />
          </div>
        </TabsContent>

        <TabsContent value="jobs" className="space-y-6">
          <JobPostingsTable />
        </TabsContent>

        <TabsContent value="pipeline" className="space-y-6">
          <RecruitmentPipeline />
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          <PerformanceAnalytics />
        </TabsContent>
      </Tabs>
    </div>
  );
}