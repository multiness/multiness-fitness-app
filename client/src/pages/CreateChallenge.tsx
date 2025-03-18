import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Gift, Dumbbell, ChevronRight, ChevronLeft } from "lucide-react";
import WorkoutGenerator from "@/components/WorkoutGenerator";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { mockChallenges } from "../data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

export default function CreateChallenge() {
  const { toast } = useToast();
  const [selectedWorkout, setSelectedWorkout] = useState<any>(null);
  const [challengeTitle, setChallengeTitle] = useState("");
  const [challengeDescription, setChallengeDescription] = useState("");
  const [startDate, setStartDate] = useState(format(new Date(), "yyyy-MM-dd"));
  const [endDate, setEndDate] = useState(format(addDays(new Date(), 30), "yyyy-MM-dd"));
  const [prize, setPrize] = useState("");
  const [prizeDescription, setPrizeDescription] = useState("");
  const [showWorkoutDialog, setShowWorkoutDialog] = useState(false);
  const [currentStep, setCurrentStep] = useState(1);

  const handleWorkoutSelect = (template: any) => {
    setSelectedWorkout(template);
    setChallengeTitle(`${template.name} Challenge`);

    const workoutDescription = `
${template.description}

Workout Details:
Typ: ${template.workoutType.toUpperCase()}
Dauer: ${template.duration} Minuten
Schwierigkeit: ${template.difficulty}

Übungen:
${template.workoutDetails.exercises.map((exercise: any) => 
  `- ${exercise.name}: ${exercise.reps || exercise.time}${exercise.reps ? ' Wiederholungen' : ' Sekunden'}
   ${exercise.description ? `  ${exercise.description}` : ''}
   ${exercise.weight ? `  Gewicht: ${exercise.weight}kg` : ''}`
).join('\n')}

Durchführung:
${template.workoutType === 'amrap' ? 
  `So viele Runden wie möglich in ${template.duration} Minuten.` :
  template.workoutType === 'emom' ?
  `Alle ${template.workoutDetails.timePerRound} Sekunden eine neue Runde für ${template.workoutDetails.rounds} Runden.` :
  `${template.workoutDetails.rounds} Runden, ${template.workoutDetails.timePerRound} Sekunden pro Runde.`}
`.trim();

    setChallengeDescription(workoutDescription);
    setShowWorkoutDialog(false);
  };

  const handleCreateChallenge = () => {
    if (!selectedWorkout) {
      toast({
        title: "Kein Workout ausgewählt",
        description: "Bitte generiere zuerst ein Workout für deine Challenge.",
        variant: "destructive",
      });
      return;
    }

    if (!challengeTitle || !challengeDescription || !prize || !prizeDescription) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte fülle alle Pflichtfelder aus.",
        variant: "destructive",
      });
      return;
    }

    const newChallenge = {
      id: mockChallenges.length + 1,
      title: challengeTitle,
      description: challengeDescription,
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      prize,
      prizeDescription,
      workoutType: selectedWorkout.workoutType,
      workoutDetails: selectedWorkout.workoutDetails,
      creatorId: 1,
      image: null,
      prizeImage: null
    };

    mockChallenges.push(newChallenge);

    toast({
      title: "Challenge erstellt!",
      description: "Deine Challenge wurde erfolgreich erstellt.",
    });

    // Reset form
    setSelectedWorkout(null);
    setChallengeTitle("");
    setChallengeDescription("");
    setPrize("");
    setPrizeDescription("");
    setStartDate(format(new Date(), "yyyy-MM-dd"));
    setEndDate(format(addDays(new Date(), 30), "yyyy-MM-dd"));
    setCurrentStep(1);
  };

  const steps = [
    {
      title: "Workout auswählen",
      isComplete: !!selectedWorkout,
      content: (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-semibold">Workout Details</h3>
              <p className="text-sm text-muted-foreground">
                Wähle ein Workout für deine Challenge aus
              </p>
            </div>
            <Button onClick={() => setShowWorkoutDialog(true)}>
              <Dumbbell className="h-4 w-4 mr-2" />
              Workout Generator
            </Button>
          </div>
          {selectedWorkout && (
            <Card>
              <CardContent className="p-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Dumbbell className="h-4 w-4 text-primary" />
                    <span className="font-medium">{selectedWorkout.name}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{selectedWorkout.description}</p>
                  <div className="grid grid-cols-3 gap-2 text-sm">
                    <div>
                      <span className="font-medium">Typ:</span>
                      <p className="text-muted-foreground">{selectedWorkout.workoutType}</p>
                    </div>
                    <div>
                      <span className="font-medium">Dauer:</span>
                      <p className="text-muted-foreground">{selectedWorkout.duration} Min</p>
                    </div>
                    <div>
                      <span className="font-medium">Level:</span>
                      <p className="text-muted-foreground">{selectedWorkout.difficulty}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      ),
    },
    {
      title: "Challenge Details",
      isComplete: !!challengeTitle && !!challengeDescription,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Titel</Label>
            <Input 
              placeholder="Gib einen Titel für deine Challenge ein"
              value={challengeTitle}
              onChange={(e) => setChallengeTitle(e.target.value)}
            />
          </div>
          <div>
            <Label>Beschreibung</Label>
            <Textarea 
              placeholder="Beschreibe deine Challenge"
              value={challengeDescription}
              onChange={(e) => setChallengeDescription(e.target.value)}
              className="min-h-[200px]"
            />
          </div>
          <div>
            <Label>Zeitraum</Label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input 
                type="date" 
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
              <Input 
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>
      ),
    },
    {
      title: "Gewinn Details",
      isComplete: !!prize && !!prizeDescription,
      content: (
        <div className="space-y-4">
          <div>
            <Label>Gewinn-Titel</Label>
            <Input 
              placeholder="z.B. Premium Protein Paket"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
            />
          </div>
          <div>
            <Label>Gewinn-Beschreibung</Label>
            <Textarea 
              placeholder="Beschreibe den Gewinn im Detail"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <div>
            <Label>Gewinn-Bild</Label>
            <div className="mt-2">
              <Button variant="outline">Bild hochladen</Button>
            </div>
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="container py-6 px-4 sm:px-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Neue Challenge erstellen</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="flex items-center justify-between relative">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center relative z-10"
              style={{ width: "33.333%" }}
            >
              <div
                className={cn(
                  "w-8 h-8 rounded-full flex items-center justify-center border-2",
                  currentStep > index + 1 || step.isComplete
                    ? "bg-primary border-primary text-primary-foreground"
                    : currentStep === index + 1
                    ? "border-primary text-primary"
                    : "border-muted-foreground text-muted-foreground"
                )}
              >
                {currentStep > index + 1 || step.isComplete ? "✓" : index + 1}
              </div>
              <span className="text-xs mt-1 text-center">{step.title}</span>
            </div>
          ))}
          <div
            className="absolute top-4 left-0 h-[2px] bg-muted-foreground"
            style={{ width: "100%", zIndex: 0 }}
          />
        </div>
      </div>

      {/* Current Step Content */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          {steps[currentStep - 1].content}
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between gap-4">
        {currentStep > 1 && (
          <Button
            variant="outline"
            onClick={() => setCurrentStep(currentStep - 1)}
          >
            <ChevronLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
        )}
        {currentStep < steps.length ? (
          <Button
            className="ml-auto"
            onClick={() => setCurrentStep(currentStep + 1)}
            disabled={!steps[currentStep - 1].isComplete}
          >
            Weiter
            <ChevronRight className="h-4 w-4 ml-2" />
          </Button>
        ) : (
          <Button
            className="ml-auto"
            onClick={handleCreateChallenge}
            disabled={!steps.every(step => step.isComplete)}
          >
            Challenge erstellen
          </Button>
        )}
      </div>

      {/* Workout Generator Dialog */}
      <Dialog open={showWorkoutDialog} onOpenChange={setShowWorkoutDialog}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Workout Generator</DialogTitle>
          </DialogHeader>
          <div className="max-h-[70vh] overflow-y-auto">
            <WorkoutGenerator onSelectWorkout={handleWorkoutSelect} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}