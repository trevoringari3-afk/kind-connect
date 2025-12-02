import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, AlertTriangle, Flag, Shield, CheckCircle, XCircle } from "lucide-react";

interface Report {
  id: string;
  reporter_id: string;
  reported_user_id: string;
  reason: string;
  description: string | null;
  status: string;
  created_at: string;
}

interface ModerationLog {
  id: string;
  user_id: string;
  content: string;
  toxicity_score: number | null;
  is_flagged: boolean;
  flag_reason: string | null;
  created_at: string;
}

const Moderation = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [isAdmin, setIsAdmin] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reports, setReports] = useState<Report[]>([]);
  const [moderationLogs, setModerationLogs] = useState<ModerationLog[]>([]);

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      navigate("/auth");
      return;
    }

    // Check if user has admin role
    const { data: roles } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin");

    if (!roles || roles.length === 0) {
      toast({
        title: "Access Denied",
        description: "You don't have permission to access this page.",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    fetchData();
  };

  const fetchData = async () => {
    setLoading(true);

    const [reportsRes, logsRes] = await Promise.all([
      supabase.from("reports").select("*").order("created_at", { ascending: false }),
      supabase.from("moderation_logs").select("*").order("created_at", { ascending: false }).limit(100),
    ]);

    if (reportsRes.data) setReports(reportsRes.data);
    if (logsRes.data) setModerationLogs(logsRes.data);

    setLoading(false);
  };

  const updateReportStatus = async (reportId: string, status: string) => {
    const { data: { user } } = await supabase.auth.getUser();
    
    const { error } = await supabase
      .from("reports")
      .update({ 
        status, 
        reviewed_at: new Date().toISOString(),
        reviewed_by: user?.id 
      })
      .eq("id", reportId);

    if (error) {
      toast({ title: "Error updating report", variant: "destructive" });
    } else {
      toast({ title: `Report marked as ${status}` });
      fetchData();
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return <Badge variant="outline" className="bg-warning/10 text-warning border-warning/20">Pending</Badge>;
      case "reviewed":
        return <Badge variant="outline" className="bg-primary/10 text-primary border-primary/20">Reviewed</Badge>;
      case "resolved":
        return <Badge variant="outline" className="bg-success/10 text-success border-success/20">Resolved</Badge>;
      case "dismissed":
        return <Badge variant="secondary">Dismissed</Badge>;
      default:
        return <Badge>{status}</Badge>;
    }
  };

  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-subtle flex items-center justify-center">
        <p className="text-muted-foreground">Checking access...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-subtle">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-50">
        <div className="container px-4 py-4 flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <h1 className="text-2xl font-display font-bold">Moderation Dashboard</h1>
          </div>
        </div>
      </header>

      <main className="container px-4 py-6">
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reports.filter(r => r.status === "pending").length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Messages</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{moderationLogs.filter(l => l.is_flagged).length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Total Reports</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">{reports.length}</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="reports">
          <TabsList className="mb-4">
            <TabsTrigger value="reports" className="gap-2">
              <Flag className="h-4 w-4" />
              User Reports
            </TabsTrigger>
            <TabsTrigger value="flagged" className="gap-2">
              <AlertTriangle className="h-4 w-4" />
              Flagged Content
            </TabsTrigger>
          </TabsList>

          <TabsContent value="reports">
            <Card>
              <CardHeader>
                <CardTitle>User Reports</CardTitle>
                <CardDescription>Review and manage user-submitted reports</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : reports.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No reports yet</p>
                  ) : (
                    <div className="space-y-4">
                      {reports.map((report) => (
                        <div key={report.id} className="p-4 rounded-lg border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div>
                              <p className="font-medium capitalize">{report.reason.replace("_", " ")}</p>
                              <p className="text-sm text-muted-foreground">{formatDate(report.created_at)}</p>
                            </div>
                            {getStatusBadge(report.status)}
                          </div>
                          {report.description && (
                            <p className="text-sm text-muted-foreground mb-3">{report.description}</p>
                          )}
                          {report.status === "pending" && (
                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => updateReportStatus(report.id, "resolved")}
                              >
                                <CheckCircle className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => updateReportStatus(report.id, "dismissed")}
                              >
                                <XCircle className="h-4 w-4 mr-1" />
                                Dismiss
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="flagged">
            <Card>
              <CardHeader>
                <CardTitle>Flagged Content</CardTitle>
                <CardDescription>AI-detected potentially harmful messages</CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  {loading ? (
                    <p className="text-center text-muted-foreground py-8">Loading...</p>
                  ) : moderationLogs.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">No flagged content</p>
                  ) : (
                    <div className="space-y-4">
                      {moderationLogs.map((log) => (
                        <div key={log.id} className="p-4 rounded-lg border border-border">
                          <div className="flex items-start justify-between mb-2">
                            <div className="flex items-center gap-2">
                              <AlertTriangle className="h-4 w-4 text-warning" />
                              <p className="text-sm text-muted-foreground">{formatDate(log.created_at)}</p>
                            </div>
                            {log.toxicity_score !== null && (
                              <Badge variant={log.toxicity_score > 0.7 ? "destructive" : "outline"}>
                                Score: {(log.toxicity_score * 100).toFixed(0)}%
                              </Badge>
                            )}
                          </div>
                          <p className="text-sm mb-2 p-2 bg-muted rounded">{log.content}</p>
                          {log.flag_reason && (
                            <p className="text-xs text-muted-foreground">Reason: {log.flag_reason}</p>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
};

export default Moderation;
