import * as Dialog from "@radix-ui/react-dialog";
import { X } from "lucide-react";
import { ChangeEvent, MouseEventHandler, useState } from "react";
import { toast } from "sonner";

interface NewNoteCardProps {
    onNoteCreated: (content: string) => void;
}

export function NewNoteCard({ onNoteCreated }: NewNoteCardProps) {
    const [shouldShowOnboarding, setShouldShowOnboarding] = useState(true);
    const [content, setContent] = useState('');
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [isRecording, setIsRecording] = useState(false);
    const [isRecordingLoading, setIsRecordingLoading] = useState(false);
    let speechRecognition: SpeechRecognition | null = null;

    function focusTextArea() {
        const noteTypeArea: HTMLTextAreaElement | null = document.querySelector('#noteTypeArea');
        noteTypeArea?.focus();
    }

    function handleStartEditor() {
        setShouldShowOnboarding(false);
        focusTextArea();
    }

    function handleStartRecording() {
        setIsRecording(true);

        const isSpeechRecognitionAPIAvailable = 'SpeechRecognition' in window
            || 'webkitSpeechRecognition' in window;

        if (!isSpeechRecognitionAPIAvailable) {
            alert('Infelizmente seu navegador não suporta a API de gravação.')
            return
        }

        const SpeechRecognitionAPI = window.SpeechRecognition || window.webkitSpeechRecognition;
        speechRecognition = new SpeechRecognitionAPI();

        speechRecognition.lang = 'pt-BR';
        speechRecognition.continuous = true;
        speechRecognition.maxAlternatives = 1;
        speechRecognition.interimResults = true;

        speechRecognition.onresult = (event) => {
            const transcription = Array.from(event.results).reduce((text, result) => {
                return text.concat(result[0].transcript)
            }, '')

            setContent(transcription);
            setIsRecordingLoading(false);
            
        }
        speechRecognition.onerror = (event) => {
            if (event.error == 'no-speech') {
                toast.error('Não foi detectada nenhuma palavra');
            }
            setIsRecordingLoading(false);
            setShouldShowOnboarding(true);
            focusTextArea();
        }

        setShouldShowOnboarding(false);
        setIsRecordingLoading(true)
        speechRecognition.start();
    }
    function handleStopRecording() {
        setIsRecording(false);

        if (speechRecognition !== null) {
            speechRecognition.stop()
        }
    }

    function handleContentChanged(event: ChangeEvent<HTMLTextAreaElement>) {
        if (event.target.value === '') {
            setShouldShowOnboarding(true);
        } else {
            setShouldShowOnboarding(false);
        }

        setContent(event.target.value);
    }

    function handleSaveNote() {
        if (content === '') {
            toast.error('Nota vazia')
            return;
        }

        onNoteCreated(content);
        toast.success('Nota salva com sucesso!');
        setContent('');
        setIsDialogOpen(false);
    }

    function handleOpenDialog() {
        if (content === '')
            setShouldShowOnboarding(true);
    }

    return (
        <Dialog.Root open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <Dialog.Trigger className="rounded-md flex flex-col text-left bg-slate-700 p-5 gap-3 overflow-hidden outline-none relative hover:ring-2 hover:ring-slate-600 focus-visible:ring-2 focus-visible:ring-lime-300" onClick={handleOpenDialog}>
                <span className="text-sm font-medium text-slate-200">Adicionar nota</span>
                <p className="text-sm leading-6 text-slate-400">
                    Grave uma nota em áudio que será convertida para texto automaticamente.
                </p>
            </Dialog.Trigger>

            <Dialog.Portal>
                <Dialog.DialogOverlay className="inset-0 fixed bg-black/60" />
                <Dialog.Content className="fixed inset-0 md:inset-auto md:left-1/2 md:top-1/2 md:-translate-x-1/2 md:-translate-y-1/2 md:max-w-[640px] w-full md:h-[60vh] bg-slate-700 md:rounded-md flex flex-col outline-none overflow-hidden">
                    <Dialog.Close className="absolute top-0 right-0 bg-slate-800 p-1.5 text-slate-400 hover:text-slate-100">
                        <X className="size-5" />
                    </Dialog.Close>

                    <form className="flex-1 flex flex-col">
                        <div className="flex flex-1 flex-col gap-3 p-5">
                            <span className="text-sm font-medium text-slate-200">Adicionar nota</span>

                            <div className="h-full">
                                {shouldShowOnboarding ? (
                                    <p className="text-sm leading-6 text-slate-400 absolute">
                                        Comece <button type="button" className="font-medium text-lime-400 hover:underline" onClick={handleStartRecording}>gravando uma nota</button> em áudio ou se preferir <button type="button" onClick={handleStartEditor} className="font-medium text-lime-400 hover:underline">utilize apenas texto</button>.
                                    </p>
                                ) : ''}
                                <textarea autoFocus id="noteTypeArea" defaultValue={content} disabled={isRecording || isRecordingLoading}
                                    className="text-sm w-full h-full leading-6 text-slate-400 bg-transparent resize-none outline-none flex flex-col"
                                    onChange={handleContentChanged} />
                            </div>
                        </div>

                        {isRecording ?
                            <button type="button" onClick={handleStopRecording}
                                className="w-full bg-slate-800 py-4 flex items-center justify-center gap-2 text-center text-sm text-slate-50 outline-none font-medium hover:text-red-800">
                                <div className="size-3 rounded-full bg-red-500 animate-pulse" />
                                Gravando... (clique para interromper)
                            </button> :
                            <button type="button" onClick={handleSaveNote}
                                className="w-full bg-lime-400 py-4 text-center text-sm text-lime-950 outline-none font-medium hover:bg-lime-500">
                                Salvar nota
                            </button>
                        }
                    </form>
                </Dialog.Content>
            </Dialog.Portal>
        </Dialog.Root>
    );
}