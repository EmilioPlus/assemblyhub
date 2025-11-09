import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Box,
  Card,
  CardContent,
  Typography,
  Button,
  Radio,
  RadioGroup,
  FormControlLabel,
  FormControl,
  FormLabel,
  Checkbox,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Alert,
  LinearProgress,
  CircularProgress,
  Chip,
} from "@mui/material";
import { useAuth } from "../contexts/AuthContext";
import axios from "axios";

interface QuestionOption {
  text: string;
  value: string;
}

interface Question {
  _id: string;
  questionText: string;
  questionType: "single" | "multiple";
  options: QuestionOption[] | string[]; // Compatible con ambas estructuras
  startTime: string;
  endTime: string;
  duration: number;
  status: string;
  order: number;
  timeRemaining: number;
  isActive: boolean;
  hasVoted: boolean;
}

export default function Voting() {
  const navigate = useNavigate();
  const { assemblyId } = useParams<{ assemblyId: string }>();
  const { token, user } = useAuth();
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<string[]>([]);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [timeRemaining, setTimeRemaining] = useState<number>(0);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!token || !user) {
      navigate("/dashboard");
      return;
    }
    // Permitir acceso a participantes y administradores (para visualización)
    if (user.role !== "participant" && user.role !== "admin") {
      navigate("/dashboard");
      return;
    }
    fetchQuestions();
  }, [token, user, navigate, assemblyId]);

  useEffect(() => {
    if (questions.length > 0 && currentQuestionIndex < questions.length) {
      const question = questions[currentQuestionIndex];
      if (question.hasVoted) {
        // Si ya votó, avanzar a la siguiente
        if (currentQuestionIndex < questions.length - 1) {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
        } else {
          setCompleted(true);
        }
      } else {
        // Inicializar tiempo restante
        setTimeRemaining(question.timeRemaining);
        setSelectedAnswers([]);
      }
    }
  }, [currentQuestionIndex, questions]);

  // Timer para mostrar tiempo restante (Historia 2: VOT-002)
  useEffect(() => {
    if (timeRemaining <= 0 || !questions[currentQuestionIndex]?.isActive) {
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1000) {
          // Tiempo agotado
          if (currentQuestionIndex < questions.length - 1) {
            // Avanzar a la siguiente pregunta
            setTimeout(() => {
              setCurrentQuestionIndex(currentQuestionIndex + 1);
            }, 1000);
          } else {
            setCompleted(true);
          }
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining, currentQuestionIndex, questions]);

  const fetchQuestions = async () => {
    try {
      setLoading(true);
      setError("");
      const response = await axios.get(
        `http://localhost:5000/api/votaciones/preguntas/${assemblyId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (response.data.questions) {
        setQuestions(response.data.questions);
        
        // Verificar si todas las preguntas ya fueron respondidas
        const allVoted = response.data.questions.every((q: Question) => q.hasVoted);
        if (allVoted) {
          setCompleted(true);
        }
      }
    } catch (err: any) {
      if (err.response?.data?.hasDelegate) {
        setError(
          "Tiene un delegado registrado. Solo el delegado puede emitir votos."
        );
      } else {
        const errorMsg = err.response?.data?.msg || "Error al cargar las preguntas";
        setError(errorMsg);
        
        // Si la asamblea no ha iniciado o ya finalizó, redirigir después de mostrar el mensaje
        if (errorMsg.includes("iniciará el") || errorMsg.includes("ha finalizado")) {
          setTimeout(() => {
            navigate("/participant-area");
          }, 3000);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  // Función helper para obtener el valor de una opción (compatible con ambas estructuras)
  const getOptionValue = (option: any): string => {
    if (typeof option === "string") return option;
    return option.value || option.text || option;
  };

  // Función helper para obtener el texto de una opción
  const getOptionText = (option: any): string => {
    if (typeof option === "string") return option;
    return option.text || option.value || option;
  };

  const handleAnswerChange = (optionValue: string | any) => {
    const currentQuestion = questions[currentQuestionIndex];
    const value = typeof optionValue === "string" ? optionValue : getOptionValue(optionValue);
    
    if (currentQuestion.questionType === "single") {
      setSelectedAnswers([value]);
    } else {
      // Múltiple
      setSelectedAnswers((prev) =>
        prev.includes(value)
          ? prev.filter((a) => a !== value)
          : [...prev, value]
      );
    }
  };

  const handleNext = () => {
    if (selectedAnswers.length === 0) {
      setError("Debe seleccionar al menos una opción");
      return;
    }
    setConfirmDialogOpen(true);
  };

  const handleConfirmVote = async () => {
    try {
      setLoading(true);
      setError("");
      setConfirmDialogOpen(false);

      const currentQuestion = questions[currentQuestionIndex];
      await axios.post(
        "http://localhost:5000/api/votaciones/emitir",
        {
          idPregunta: currentQuestion._id,
          respuesta: selectedAnswers,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      setSuccess("Voto registrado exitosamente");

      // Actualizar estado de la pregunta
      const updatedQuestions = [...questions];
      updatedQuestions[currentQuestionIndex].hasVoted = true;
      setQuestions(updatedQuestions);

      // Avanzar a la siguiente pregunta o completar
      if (currentQuestionIndex < questions.length - 1) {
        setTimeout(() => {
          setCurrentQuestionIndex(currentQuestionIndex + 1);
          setSuccess("");
        }, 1500);
      } else {
        setTimeout(() => {
          setCompleted(true);
        }, 1500);
      }
    } catch (err: any) {
      setError(err.response?.data?.msg || "Error al registrar el voto");
      if (err.response?.data?.msg?.includes("Tiempo agotado")) {
        // Si el tiempo se agotó, avanzar a la siguiente pregunta
        if (currentQuestionIndex < questions.length - 1) {
          setTimeout(() => {
            setCurrentQuestionIndex(currentQuestionIndex + 1);
          }, 2000);
        } else {
          setCompleted(true);
        }
      }
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${minutes}:${secs.toString().padStart(2, "0")}`;
  };

  if (loading && questions.length === 0) {
    return (
      <Box
        sx={{
          display: "flex",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "100vh",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  if (error && !questions.length) {
    return (
      <Box sx={{ backgroundColor: "#d9ebfa", minHeight: "100vh", padding: "2rem" }}>
        <Card sx={{ maxWidth: 800, margin: "0 auto" }}>
          <CardContent>
            <Alert severity="error">{error}</Alert>
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard")}
              sx={{ mt: 2 }}
            >
              Volver al Panel
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  if (completed || questions.every((q) => q.hasVoted)) {
    return (
      <Box sx={{ backgroundColor: "#d9ebfa", minHeight: "100vh", padding: "2rem" }}>
        <Card sx={{ maxWidth: 800, margin: "0 auto" }}>
          <CardContent sx={{ textAlign: "center", padding: "4rem" }}>
            <Typography variant="h4" color="primary" gutterBottom>
              ¡Gracias por participar!
            </Typography>
            <Typography variant="h6" color="textSecondary" sx={{ mt: 2 }}>
              Ha completado todas las votaciones.
            </Typography>
            <Button
              variant="contained"
              onClick={() => navigate("/dashboard")}
              sx={{ mt: 3 }}
            >
              Volver al Panel
            </Button>
          </CardContent>
        </Card>
      </Box>
    );
  }

  const currentQuestion = questions[currentQuestionIndex];
  if (!currentQuestion) {
    return null;
  }

  const isTimeExpired = timeRemaining <= 0;
  const progress = ((currentQuestionIndex + 1) / questions.length) * 100;

  return (
    <Box sx={{ backgroundColor: "#d9ebfa", minHeight: "100vh", padding: "2rem" }}>
      <Card sx={{ maxWidth: 900, margin: "0 auto" }}>
        <CardContent sx={{ padding: "2rem" }}>
          {/* Header con progreso */}
          <Box sx={{ mb: 3 }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
              <Typography variant="h6" color="primary">
                Votación en curso
              </Typography>
              <Typography variant="body1" color="textSecondary">
                Pregunta {currentQuestionIndex + 1} de {questions.length}
              </Typography>
            </Box>
            <LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
          </Box>

          {/* Contador de tiempo (Historia 2: VOT-002) */}
          <Box sx={{ mb: 3, textAlign: "center" }}>
            <Chip
              label={
                isTimeExpired
                  ? "Tiempo agotado"
                  : `Tiempo restante: ${formatTime(timeRemaining)}`
              }
              color={isTimeExpired ? "error" : timeRemaining < 30000 ? "warning" : "primary"}
              sx={{ fontSize: "1rem", padding: "0.5rem 1rem" }}
            />
          </Box>

          {/* Mensajes */}
          {error && (
            <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError("")}>
              {error}
            </Alert>
          )}
          {success && (
            <Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess("")}>
              {success}
            </Alert>
          )}

          {/* Pregunta actual */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
              {currentQuestion.questionText}
            </Typography>

            {currentQuestion.questionType === "single" ? (
              <FormControl component="fieldset">
                <RadioGroup
                  value={selectedAnswers[0] || ""}
                  onChange={(e) => handleAnswerChange(e.target.value)}
                >
                  {currentQuestion.options.map((option, index) => {
                    const optionValue = getOptionValue(option);
                    const optionText = getOptionText(option);
                    return (
                      <FormControlLabel
                        key={index}
                        value={optionValue}
                        control={<Radio />}
                        label={optionText}
                        disabled={isTimeExpired || loading}
                      />
                    );
                  })}
                </RadioGroup>
              </FormControl>
            ) : (
              <FormControl component="fieldset">
                {currentQuestion.options.map((option, index) => {
                  const optionValue = getOptionValue(option);
                  const optionText = getOptionText(option);
                  return (
                    <FormControlLabel
                      key={index}
                      control={
                        <Checkbox
                          checked={selectedAnswers.includes(optionValue)}
                          onChange={() => handleAnswerChange(optionValue)}
                          disabled={isTimeExpired || loading}
                        />
                      }
                      label={optionText}
                    />
                  );
                })}
              </FormControl>
            )}
          </Box>

          {/* Botones */}
          <Box sx={{ display: "flex", justifyContent: "space-between", mt: 4 }}>
            <Button
              variant="outlined"
              onClick={() => navigate("/dashboard")}
              disabled={loading}
            >
              Cancelar
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
              disabled={
                selectedAnswers.length === 0 ||
                isTimeExpired ||
                loading ||
                currentQuestion.hasVoted
              }
            >
              {loading ? "Registrando..." : "Confirmar voto"}
            </Button>
          </Box>
        </CardContent>
      </Card>

      {/* Diálogo de confirmación (Historia 4: VOT-004) */}
      <Dialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
      >
        <DialogTitle>Confirmar voto</DialogTitle>
        <DialogContent>
          <Typography>
            ¿Está seguro de confirmar su voto? No podrá modificarlo.
          </Typography>
          <Typography variant="body2" color="textSecondary" sx={{ mt: 2 }}>
            Respuesta seleccionada:
          </Typography>
          <Box sx={{ mt: 1 }}>
            {selectedAnswers.map((answer, index) => {
              // Buscar el texto correspondiente al valor
              const option = currentQuestion.options.find((opt: any) => {
                const val = typeof opt === "string" ? opt : opt.value;
                return val === answer;
              });
              const answerText = option ? (typeof option === "string" ? option : option.text) : answer;
              return <Chip key={index} label={answerText} sx={{ mr: 1, mb: 1 }} />;
            })}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmDialogOpen(false)}>Cancelar</Button>
          <Button onClick={handleConfirmVote} variant="contained" color="primary">
            Confirmar
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}

