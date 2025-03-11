import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Users,
  Trophy,
  Users2,
  TrendingUp,
  Image as ImageIcon,
  Upload,
  Shield,
  CheckCircle,
  UserCog
} from "lucide-react";
import { mockUsers, mockChallenges, mockGroups, mockPosts } from "../data/mockData";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { VerifiedBadge } from "@/components/VerifiedBadge";

export default function Admin() {
  return (
    <div className="container max-w-6xl mx-auto p-4">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockUsers.length}</div>
            <p className="text-xs text-muted-foreground">
              +12% from last month
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Active Challenges</CardTitle>
            <Trophy className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockChallenges.length}</div>
            <p className="text-xs text-muted-foreground">
              3 ending this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Groups</CardTitle>
            <Users2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockGroups.length}</div>
            <p className="text-xs text-muted-foreground">
              2 new this week
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">Total Posts</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{mockPosts.length}</div>
            <p className="text-xs text-muted-foreground">
              +25% engagement rate
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Area */}
      <Tabs defaultValue="team">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="team">Team Management</TabsTrigger>
          <TabsTrigger value="banner">Marketing Banner</TabsTrigger>
          <TabsTrigger value="moderation">Content Moderation</TabsTrigger>
        </TabsList>

        <TabsContent value="team">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Team & Verification Management
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-6">
                <div className="flex gap-4 items-center">
                  <Input placeholder="Search users..." className="max-w-sm" />
                  <Button variant="outline">
                    <UserCog className="h-4 w-4 mr-2" />
                    Add Team Member
                  </Button>
                </div>

                <ScrollArea className="h-[400px]">
                  {mockUsers.map(user => (
                    <div key={user.id} className="flex items-center justify-between border-b p-4">
                      <div className="flex items-center gap-3">
                        <img
                          src={user.avatar}
                          alt={user.username}
                          className="w-10 h-10 rounded-full object-cover"
                        />
                        <div>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">@{user.username}</span>
                            {user.isVerified && <VerifiedBadge />}
                          </div>
                          <div className="text-sm text-muted-foreground">{user.name}</div>
                        </div>
                      </div>

                      <div className="flex items-center gap-6">
                        <div className="flex items-center gap-2">
                          <span className="text-sm">Verified</span>
                          <Switch
                            checked={user.isVerified}
                            onCheckedChange={() => {}}
                          />
                        </div>

                        <div className="flex items-center gap-2">
                          <span className="text-sm">Team Role</span>
                          <Select defaultValue={user.teamRole || "none"}>
                            <SelectTrigger className="w-[140px]">
                              <SelectValue placeholder="Select role" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">No Role</SelectItem>
                              <SelectItem value="moderator">Moderator</SelectItem>
                              <SelectItem value="content_manager">Content Manager</SelectItem>
                              <SelectItem value="support">Support</SelectItem>
                              <SelectItem value="trainer">Trainer</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        <Button variant="ghost" size="sm">
                          Save
                        </Button>
                      </div>
                    </div>
                  ))}
                </ScrollArea>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banner">
          <Card>
            <CardHeader>
              <CardTitle>Marketing Banner Management</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="border rounded-lg p-4">
                  <h3 className="font-semibold mb-2">Current Banner</h3>
                  <img
                    src="https://images.unsplash.com/photo-1517963879433-6ad2b056d712?w=1200&auto=format"
                    alt="Current banner"
                    className="w-full h-32 object-cover rounded-lg mb-2"
                  />
                  <div className="text-sm text-muted-foreground">
                    Impressions: 1,234 | Clicks: 89 | CTR: 7.2%
                  </div>
                </div>

                <div className="space-y-2">
                  <h3 className="font-semibold">Upload New Banner</h3>
                  <div className="border-2 border-dashed rounded-lg p-8 text-center">
                    <ImageIcon className="h-8 w-8 mx-auto mb-2 text-muted-foreground" />
                    <div className="text-sm text-muted-foreground mb-2">
                      Drag and drop or click to upload
                    </div>
                    <Button>
                      <Upload className="h-4 w-4 mr-2" />
                      Upload Image
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="moderation">
          <Card>
            <CardHeader>
              <CardTitle>Content Moderation Queue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Input placeholder="Search reported content..." />
              </div>
              <ScrollArea className="h-[400px]">
                {mockPosts.map(post => (
                  <div key={post.id} className="border-b p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <h3 className="font-semibold">
                          Post by @{mockUsers.find(u => u.id === post.userId)?.username}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {post.content}
                        </p>
                      </div>
                      <div className="space-x-2">
                        <Button variant="destructive" size="sm">Remove</Button>
                        <Button variant="outline" size="sm">Approve</Button>
                      </div>
                    </div>
                  </div>
                ))}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}