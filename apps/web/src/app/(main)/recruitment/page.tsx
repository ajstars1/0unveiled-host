"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { CandidateRanking } from "@/components/recruitment/candidate-ranking";
import { OutreachCRM } from "@/components/recruitment/outreach-crm";
import { EnterpriseRecruitmentDashboard } from "@/components/recruitment/enterprise-dashboard";

export default function RecruitmentPage() {
  return (
    <div className="container mx-auto py-8 space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">AI Recruitment Platform</h1>
          <p className="text-muted-foreground">
            Advanced AI-powered candidate matching and recruitment tools
          </p>
        </div>
      </div>

      <Tabs defaultValue="search" className="space-y-8">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="search">Candidate Search</TabsTrigger>
          <TabsTrigger value="outreach">Outreach CRM</TabsTrigger>
          <TabsTrigger value="dashboard">Enterprise Dashboard</TabsTrigger>
        </TabsList>

        <TabsContent value="search" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>AI-Powered Candidate Matching</CardTitle>
            </CardHeader>
            <CardContent>
              <CandidateRanking />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="outreach" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Outreach CRM</CardTitle>
            </CardHeader>
            <CardContent>
              <OutreachCRM />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="dashboard" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Enterprise Recruitment Dashboard</CardTitle>
            </CardHeader>
            <CardContent>
              <EnterpriseRecruitmentDashboard />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}