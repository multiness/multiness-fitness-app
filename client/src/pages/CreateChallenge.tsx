import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Timer, Dumbbell, Trophy, Gift } from "lucide-react";

type WorkoutType = "emom" | "amrap" | "hit" | "running" | "custom";

export default function CreateChallenge() {
  const [workoutType, setWorkoutType] = useState<WorkoutType | null>(null);

  return (
    <div className="container max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-6">Create New Challenge</h1>

      {/* Workout Type Selection */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Select Workout Type</CardTitle>
        </CardHeader>
        <CardContent>
          <RadioGroup
            onValueChange={(value) => setWorkoutType(value as WorkoutType)}
            className="grid grid-cols-1 md:grid-cols-2 gap-4"
          >
            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="emom" className="mt-1" />
              <div>
                <Timer className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">EMOM</div>
                <p className="text-sm text-muted-foreground">
                  Every Minute On the Minute workouts
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="amrap" className="mt-1" />
              <div>
                <Timer className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">AMRAP</div>
                <p className="text-sm text-muted-foreground">
                  As Many Rounds As Possible
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="hit" className="mt-1" />
              <div>
                <Dumbbell className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">HIT Workout</div>
                <p className="text-sm text-muted-foreground">
                  High Intensity Training
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="running" className="mt-1" />
              <div>
                <Timer className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">Running</div>
                <p className="text-sm text-muted-foreground">
                  Time or distance based runs
                </p>
              </div>
            </Label>

            <Label className="flex items-start space-x-3 p-4 cursor-pointer border rounded-lg hover:bg-accent">
              <RadioGroupItem value="custom" className="mt-1" />
              <div>
                <Trophy className="h-5 w-5 mb-2 text-primary" />
                <div className="font-semibold">Custom Workout</div>
                <p className="text-sm text-muted-foreground">
                  Create your own workout type
                </p>
              </div>
            </Label>
          </RadioGroup>
        </CardContent>
      </Card>

      {/* Basic Challenge Info */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Challenge Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input placeholder="Enter challenge title" />
          </div>
          <div>
            <Label>Description</Label>
            <Textarea placeholder="Describe your challenge" />
          </div>
          <div>
            <Label>Duration</Label>
            <div className="grid grid-cols-2 gap-4">
              <Input type="date" placeholder="Start Date" />
              <Input type="date" placeholder="End Date" />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Prize Section */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Gift className="h-5 w-5" />
            Prize Details
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Prize Name</Label>
            <Input placeholder="e.g. Premium Protein Pack" />
          </div>
          <div>
            <Label>Prize Description</Label>
            <Textarea placeholder="Describe what the winner will receive" />
          </div>
          <div>
            <Label>Prize Image</Label>
            <div className="mt-2">
              <Button variant="outline">Upload Image</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-end gap-4">
        <Button variant="outline">Save as Template</Button>
        <Button>Create Challenge</Button>
      </div>
    </div>
  );
}