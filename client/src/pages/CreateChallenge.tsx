import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Gift, Dumbbell, ChevronRight, ChevronLeft, Clock, RefreshCw, Plus, X, Award, Image } from "lucide-react";
import WorkoutGenerator from "@/components/WorkoutGenerator";
import { useToast } from "@/hooks/use-toast";
import { format, addDays } from "date-fns";
import { mockChallenges, badgeTests, exerciseDatabase, saveNewChallenge } from "../data/mockData";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn } from "@/lib/utils";
import { ExerciseDetails } from "@/components/ExerciseDetails";

interface Exercise {
  name: string;
  reps: number;
  weight?: number;
  description?: string;
}

interface WorkoutDetails {
  type: string;
  timePerRound?: number;
  rounds?: number;
  exercises: Exercise[];
  distance?: number;
  targetType?: 'time' | 'distance';
}

interface BadgeTest {
  id: string;
  name: string;
  description: string;
  requirements: {
    name: string;
    requirement: string;
    levels?: { level: string; requirement: string }[];
    gender_specific?: any;
  }[];
}

// Zuerst die ImageUploadSection Komponente definieren
const ImageUploadSection = ({ type, image, onChange }: { type: 'challenge' | 'prize', image: string | null, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <div className="space-y-2">
    <Label>{type === 'challenge' ? 'Challenge Bild (Optional)' : 'Gewinn Bild (Optional)'}</Label>
    <div className="flex items-center gap-4">
      <Input
        type="file"
        accept="image/*"
        onChange={onChange}
        className="flex-1"
      />
      {image && (
        <div className="relative w-20 h-20">
          <img src={image} alt="" className="w-full h-full object-cover rounded-lg" />
          <Button
            variant="ghost"
            size="sm"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0"
            onClick={() => type === 'challenge' ? setChallengeImage(null) : setPrizeImage(null)}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}
    </div>
  </div>
);

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
  const [creationMethod, setCreationMethod] = useState<"manual" | "generator" | "badge" | null>(null);

  // Neue States für manuelle Workout-Erstellung
  const [workoutType, setWorkoutType] = useState<string>("");
  const [timePerRound, setTimePerRound] = useState<string>("");
  const [rounds, setRounds] = useState<string>("");
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [distance, setDistance] = useState<string>("");
  const [timeLimit, setTimeLimit] = useState<string>("");
  const [selectedBadgeTest, setSelectedBadgeTest] = useState<string>("");
  const [challengeImage, setChallengeImage] = useState<string | null>(null);
  const [prizeImage, setPrizeImage] = useState<string | null>(null);
  const [targetType, setTargetType] = useState<'time' | 'distance'>('distance');

  const workoutTypes = [
    { value: "amrap", label: "AMRAP (As Many Rounds As Possible)" },
    { value: "emom", label: "EMOM (Every Minute On the Minute)" },
    { value: "fortime", label: "For Time" },
    { value: "distance", label: "Laufdistanz" },
    { value: "custom", label: "Eigenes Workout" },
  ];

  const handleAddExercise = () => {
    setExercises([...exercises, { name: "", reps: 0 }]);
  };

  const handleRemoveExercise = (index: number) => {
    setExercises(exercises.filter((_, i) => i !== index));
  };

  const handleExerciseChange = (index: number, field: keyof Exercise, value: string | number) => {
    const newExercises = [...exercises];
    newExercises[index] = { ...newExercises[index], [field]: value };
    setExercises(newExercises);
  };

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

  const handleBadgeSelect = (badgeId: string) => {
    const selectedTest = badgeTests.find(t => t.id === badgeId);
    if (selectedTest) {
      setSelectedBadgeTest(badgeId);
      setChallengeTitle(`${selectedTest.name} Challenge`);
      const description = `${selectedTest.description}\n\nAnforderungen:\n${selectedTest.requirements
        .map(req => {
          if ('levels' in req && req.levels) {
            return `\n${req.name}:\n${req.levels
              .map(level => `- ${level.level}: ${level.requirement}`)
              .join('\n')}`;
          }
          return `\n${req.name}: ${req.requirement}`;
        })
        .join('\n')}`;
      setChallengeDescription(description);
    }
  };

  const generateWorkoutDescription = () => {
    if (!workoutType) return "";

    let details = `Workout Typ: ${workoutType.toUpperCase()}\n\n`;

    if (workoutType === "distance") {
      details += targetType === 'distance'
        ? `Zieldistanz: ${distance} km\n`
        : `Zeitlimit: ${distance} Minuten\n`;
      return details;
    }

    switch (workoutType) {
      case "amrap":
        details += `AMRAP ${timeLimit} Minuten:\n`;
        break;
      case "emom":
        details += `EMOM ${rounds} Runden:\n`;
        details += `${timePerRound} Sekunden pro Runde\n`;
        break;
      case "fortime":
        details += `Für Zeit:\n${rounds} Runden\n`;
        break;
      case "custom":
        details += "Freies Workout\n";
        break;
    }

    if (exercises.length > 0) {
      details += "\nÜbungen:\n";
      exercises.forEach((exercise, index) => {
        details += `${index + 1}. ${exercise.name}: ${exercise.reps}x`;
        if (exercise.weight) details += ` (${exercise.weight}kg)`;
        if (exercise.description) details += `\n   ${exercise.description}`;
        details += "\n";
      });
    }

    return details;
  };

  const handleImageUpload = (event: React.ChangeEvent<HTMLInputElement>, type: 'challenge' | 'prize') => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        if (type === 'challenge') {
          setChallengeImage(reader.result as string);
        } else {
          setPrizeImage(reader.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const needsExercises = (type: string) => {
    return !['distance', 'running', 'custom'].includes(type);
  };

  const isStepComplete = (step: number) => {
    switch (step) {
      case 1:
        return !!creationMethod;
      case 2:
        if (!challengeTitle.trim()) return false;

        if (creationMethod === 'generator') return !!selectedWorkout;
        if (creationMethod === 'manual') {
          if (!workoutType) return false;
          if (needsExercises(workoutType)) {
            return exercises.length > 0;
          }
          if (workoutType === 'distance') {
            return !!distance;
          }
          return true;
        }
        if (creationMethod === 'badge') return !!selectedBadgeTest;
        return false;
      case 3:
        const hasDescription = challengeDescription.trim().length > 0 || generateWorkoutDescription().trim().length > 0;
        const hasDates = startDate && endDate;
        return hasDescription && hasDates;
      case 4:
        return true; // Gewinn ist optional
      default:
        return false;
    }
  };

  const handleCreateChallenge = () => {
    if (creationMethod === "generator" && !selectedWorkout) {
      toast({
        title: "Kein Workout ausgewählt",
        description: "Bitte generiere zuerst ein Workout für deine Challenge.",
        variant: "destructive",
      });
      return;
    }

    if (creationMethod === "manual" && (!workoutType || (needsExercises(workoutType) && exercises.length === 0))) {
      toast({
        title: "Unvollständige Workout-Details",
        description: "Bitte fülle alle Workout-Details aus und füge mindestens eine Übung hinzu.",
        variant: "destructive",
      });
      return;
    }

    if (creationMethod === "badge" && !selectedBadgeTest) {
      toast({
        title: "Kein Test ausgewählt",
        description: "Bitte wähle einen Fitness-Test aus.",
        variant: "destructive",
      });
      return;
    }

    if (!challengeTitle || !challengeDescription) {
      toast({
        title: "Fehlende Informationen",
        description: "Bitte gib einen Titel und eine Beschreibung für deine Challenge ein.",
        variant: "destructive",
      });
      return;
    }

    const workoutDetails = creationMethod === "manual" ? {
      type: workoutType,
      timePerRound: Number(timePerRound) || undefined,
      rounds: Number(rounds) || undefined,
      exercises: exercises,
      distance: distance ? Number(distance) : undefined,
      targetType: workoutType === 'distance' ? targetType : undefined
    } : creationMethod === "generator" ? selectedWorkout.workoutDetails : {
      type: "badge",
      exercises: []
    };

    const newChallenge = {
      id: Date.now(), // Unique ID based on timestamp
      title: challengeTitle,
      description: challengeDescription,
      startDate: new Date(startDate).toISOString(),
      endDate: new Date(endDate).toISOString(),
      prize: prize || null,
      prizeDescription: prizeDescription || null,
      workoutType: creationMethod === "manual" ? workoutType :
                  creationMethod === "generator" ? selectedWorkout.workoutType : "badge",
      workoutDetails,
      creatorId: 1, // Current user ID -  Should be replaced with actual user ID
      image: challengeImage,
      prizeImage: prizeImage
    };

    // Save the new challenge to localStorage
    saveNewChallenge(newChallenge);

    toast({
      title: "Challenge erstellt!",
      description: "Deine Challenge wurde erfolgreich erstellt und gespeichert.",
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
    setCreationMethod(null);
    setWorkoutType("");
    setTimePerRound("");
    setRounds("");
    setExercises([]);
    setDistance("");
    setTimeLimit("");
    setSelectedBadgeTest("");
    setChallengeImage(null);
    setPrizeImage(null);
    setTargetType('distance');

    // Optional: Redirect to the challenges page
    window.location.href = '/challenges';
  };

  const steps = [
    {
      title: "Art wählen",
      isComplete: !!creationMethod,
      content: (
        <div className="space-y-6">
          <p className="text-muted-foreground">
            Wähle aus, wie du deine Challenge erstellen möchtest
          </p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                creationMethod === "manual" && "border-primary"
              )}
              onClick={() => setCreationMethod("manual")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Plus className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Eigenes Workout</h3>
                <p className="text-sm text-muted-foreground">
                  Erstelle dein eigenes Workout von Grund auf
                </p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                creationMethod === "generator" && "border-primary"
              )}
              onClick={() => {
                setCreationMethod("generator");
                setShowWorkoutDialog(true);
              }}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Dumbbell className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Workout Generator</h3>
                <p className="text-sm text-muted-foreground">
                  Nutze unseren Generator für vorgefertigte Workouts
                </p>
              </CardContent>
            </Card>

            <Card
              className={cn(
                "cursor-pointer transition-all hover:border-primary",
                creationMethod === "badge" && "border-primary"
              )}
              onClick={() => setCreationMethod("badge")}
            >
              <CardContent className="p-6 flex flex-col items-center text-center">
                <div className="h-12 w-12 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Award className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold mb-2">Fitness-Test</h3>
                <p className="text-sm text-muted-foreground">
                  Wähle einen standardisierten Fitness-Test oder Abzeichen
                </p>
              </CardContent>
            </Card>
          </div>
        </div>
      ),
    },
    {
      title: "Challenge Details",
      isComplete: isStepComplete(2),
      content: (
        <div className="space-y-6">
          {creationMethod === "manual" && (
            <>
              <div className="space-y-4">
                <div>
                  <Label>Challenge Titel<span className="text-red-500">*</span></Label>
                  <Input
                    placeholder="Gib einen Titel für deine Challenge ein"
                    value={challengeTitle}
                    onChange={(e) => setChallengeTitle(e.target.value)}
                  />
                  {!challengeTitle.trim() && (
                    <p className="text-sm text-red-500 mt-1">
                      Bitte gib einen Titel für deine Challenge ein
                    </p>
                  )}
                </div>
                <div>
                  <Label>Workout Typ</Label>
                  <Select value={workoutType} onValueChange={setWorkoutType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Wähle einen Workout-Typ" />
                    </SelectTrigger>
                    <SelectContent>
                      {workoutTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {workoutType === "amrap" && (
                  <div>
                    <Label>Zeitlimit (Minuten)</Label>
                    <Input
                      type="number"
                      value={timeLimit}
                      onChange={(e) => setTimeLimit(e.target.value)}
                      placeholder="z.B. 20"
                    />
                  </div>
                )}

                {workoutType === "emom" && (
                  <>
                    <div>
                      <Label>Anzahl Runden</Label>
                      <Input
                        type="number"
                        value={rounds}
                        onChange={(e) => setRounds(e.target.value)}
                        placeholder="z.B. 10"
                      />
                    </div>
                    <div>
                      <Label>Zeit pro Runde (Sekunden)</Label>
                      <Input
                        type="number"
                        value={timePerRound}
                        onChange={(e) => setTimePerRound(e.target.value)}
                        placeholder="z.B. 60"
                      />
                    </div>
                  </>
                )}

                {workoutType === "fortime" && (
                  <div>
                    <Label>Anzahl Runden</Label>
                    <Input
                      type="number"
                      value={rounds}
                      onChange={(e) => setRounds(e.target.value)}
                      placeholder="z.B. 5"
                    />
                  </div>
                )}

                {workoutType === "distance" && (
                  <div className="space-y-4">
                    <div>
                      <Label>Distanz oder Zeit?</Label>
                      <Select value={targetType} onValueChange={(value: 'time' | 'distance') => setTargetType(value)}>
                        <SelectTrigger>
                          <SelectValue placeholder="Wähle die Messmethode" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="distance">Nach Distanz (km)</SelectItem>
                          <SelectItem value="time">Nach Zeit (Minuten)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label>{targetType === 'distance' ? 'Zieldistanz (km)' : 'Zeitlimit (Minuten)'}</Label>
                      <Input
                        type="number"
                        value={distance}
                        onChange={(e) => setDistance(e.target.value)}
                        placeholder={targetType === 'distance' ? "z.B. 5" : "z.B. 30"}
                      />
                    </div>
                  </div>
                )}

                {workoutType && needsExercises(workoutType) && (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <Label>Übungen</Label>
                      <Button type="button" onClick={handleAddExercise} variant="outline" size="sm">
                        <Plus className="h-4 w-4 mr-2" />
                        Übung hinzufügen
                      </Button>
                    </div>
                    <div className="space-y-4">
                      {exercises.map((exercise, index) => (
                        <div key={index} className="flex gap-4 items-start p-4 bg-muted/50 rounded-lg relative">
                          <Button
                            variant="ghost"
                            size="sm"
                            className="absolute right-2 top-2 h-6 w-6 p-0"
                            onClick={() => handleRemoveExercise(index)}
                          >
                            <X className="h-4 w-4" />
                          </Button>
                          <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div>
                              <Label>Name</Label>
                              <Input
                                value={exercise.name}
                                onChange={(e) => handleExerciseChange(index, "name", e.target.value)}
                                placeholder="z.B. Burpees"
                              />
                            </div>
                            <div>
                              <Label>Wiederholungen</Label>
                              <Input
                                type="number"
                                value={exercise.reps}
                                onChange={(e) => handleExerciseChange(index, "reps", Number(e.target.value))}
                                placeholder="z.B. 10"
                              />
                            </div>
                            <div>
                              <Label>Gewicht (kg, optional)</Label>
                              <Input
                                type="number"
                                value={exercise.weight || ""}
                                onChange={(e) => handleExerciseChange(index, "weight", Number(e.target.value))}
                                placeholder="z.B. 20"
                              />
                            </div>
                            <div>
                              <Label>Beschreibung (optional)</Label>
                              <Input
                                value={exercise.description || ""}
                                onChange={(e) => handleExerciseChange(index, "description", e.target.value)}
                                placeholder="z.B. Mit Pushup"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {creationMethod === "generator" && selectedWorkout && (
            <>
              <div>
                <Label>Challenge Titel</Label>
                <Input
                  placeholder="Gib einen Titel für deine Challenge ein"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                />
              </div>
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
              <Button variant="outline" onClick={() => setShowWorkoutDialog(true)}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Anderes Workout wählen
              </Button>
              {selectedWorkout.workoutDetails.exercises.map((exercise: any, index: number) => (
                <ExerciseDetails
                  key={index}
                  name={exercise.name}
                  description={exercise.description}
                  instruction={exerciseDatabase.exercises[exercise.name.toLowerCase()]?.instruction}
                  tips={exerciseDatabase.exercises[exercise.name.toLowerCase()]?.tips}
                />
              ))}
            </>
          )}

          {creationMethod === "badge" && (
            <div className="space-y-4">
              <div>
                <Label>Challenge Titel</Label>
                <Input
                  placeholder="Gib einen Titel für deine Challenge ein"
                  value={challengeTitle}
                  onChange={(e) => setChallengeTitle(e.target.value)}
                />
              </div>
              <div>
                <Label>Wähle einen Test</Label>
                <Select value={selectedBadgeTest} onValueChange={handleBadgeSelect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Wähle einen Fitness-Test" />
                  </SelectTrigger>
                  <SelectContent>
                    {badgeTests.map((test) => (
                      <SelectItem key={test.id} value={test.id}>
                        {test.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {selectedBadgeTest && (
                <Card className="mt-4">
                  <CardHeader>
                    <CardTitle>{badgeTests.find(t => t.id === selectedBadgeTest)?.name}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <p className="text-muted-foreground">
                        {badgeTests.find(t => t.id === selectedBadgeTest)?.description}
                      </p>
                      <div className="space-y-2">
                        {badgeTests
                          .find(t => t.id === selectedBadgeTest)
                          ?.requirements.map((req, index) => (
                            <ExerciseDetails
                              key={index}
                              name={req.name}
                              description={req.requirement}
                              requirements={req.gender_specific}
                            />
                          ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </div>
      ),
    },
    {
      title: "Challenge Info",
      isComplete: isStepComplete(3),
      content: (
        <div className="space-y-4">
          <div>
            <Label>Beschreibung</Label>
            <Textarea
              placeholder="Beschreibe deine Challenge"
              value={challengeDescription || generateWorkoutDescription()}
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
          <ImageUploadSection
            type="challenge"
            image={challengeImage}
            onChange={(e) => handleImageUpload(e, 'challenge')}
          />
        </div>
      ),
    },
    {
      title: "Gewinn Details",
      isComplete: true, // Always complete since prize is optional
      content: (
        <div className="space-y-4">
          <p className="text-sm text-muted-foreground mb-4">
            Optional: Füge einen Gewinn für die Challenge hinzu
          </p>
          <div>
            <Label>Gewinn-Titel (Optional)</Label>
            <Input
              placeholder="z.B. Premium Protein Paket"
              value={prize}
              onChange={(e) => setPrize(e.target.value)}
            />
          </div>
          <div>
            <Label>Gewinn-Beschreibung (Optional)</Label>
            <Textarea
              placeholder="Beschreibe den Gewinn im Detail"
              value={prizeDescription}
              onChange={(e) => setPrizeDescription(e.target.value)}
              className="min-h-[100px]"
            />
          </div>
          <ImageUploadSection
            type="prize"
            image={prizeImage}
            onChange={(e) => handleImageUpload(e, 'prize')}
          />
        </div>
      ),
    },
  ];

  return (
    <div className="container py-6 px-4 sm:px-6 max-w-2xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Neue Challenge erstellen</h1>

      {/* Progress Steps */}
      <div className="mb-8">
        <div className="hidden sm:flex items-center justify-between relative">
          {steps.map((step, index) => (
            <div
              key={index}
              className="flex flex-col items-center relative z-10"
              style={{ width: "25%" }}
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

        {/* Mobile Steps */}
        <div className="sm:hidden text-sm text-muted-foreground mb-4">
          Schritt {currentStep} von {steps.length}: {steps[currentStep - 1].title}
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