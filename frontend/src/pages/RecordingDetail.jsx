import React, { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
import {
	ArrowLeft,
	Download,
	FileText,
	Clock,
	Calendar,
	Play,
	Pause,
	Volume2,
	Moon,
	Sun,
	FileDown,
} from "lucide-react";

const RecordingDetail = () => {
	const { id } = useParams();
	const navigate = useNavigate();

	const [recording, setRecording] = useState(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState("");
	const [activeTab, setActiveTab] = useState("transcript");
	const [darkMode, setDarkMode] = useState(() => {
		return localStorage.getItem('darkMode') === 'true'
	});

	// Audio
	const [isPlaying, setIsPlaying] = useState(false);
	const [audioProgress, setAudioProgress] = useState(0);
	const audioRef = useRef(null);

	// Filename inputs for PDFs
	const [transcriptFilename, setTranscriptFilename] =
		useState("transcript.pdf");
	const [summaryFilename, setSummaryFilename] = useState("summary.pdf");

	useEffect(() => {
		if (darkMode) {
			document.documentElement.classList.add('dark')
		} else {
			document.documentElement.classList.remove('dark')
		}
		localStorage.setItem('darkMode', darkMode)
	}, [darkMode]);

	const toggleDarkMode = () => {
		setDarkMode(!darkMode)
	};

	useEffect(() => {
		fetchRecording();
	}, [id]);

	// Fetch audio with token
	useEffect(() => {
		if (recording?.audio_file_path && audioRef.current) {
			const token = localStorage.getItem("token");
			if (!token) return;

			const audioUrl = `/api/recordings/${id}/audio`;

			fetch(audioUrl, {
				headers: { Authorization: `Bearer ${token}` },
			})
				.then((res) => res.blob())
				.then((blob) => {
					const url = URL.createObjectURL(blob);
					audioRef.current.src = url;
					audioRef.current.load();
				})
				.catch((err) => {
					console.error("Audio load error:", err);
					setError("Failed to load audio file");
				});
		}
	}, [recording]);

	const fetchRecording = async () => {
		try {
			const res = await axios.get(`/api/recordings/${id}`);
			setRecording(res.data.recording);
		} catch (err) {
			console.error(err);
			setError("Failed to load recording");
		} finally {
			setLoading(false);
		}
	};

	const formatDate = (d) => {
		const date = new Date(d);
		return (
			date.toLocaleDateString() +
			" " +
			date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
		);
	};

	const formatDuration = (sec) => {
		if (!sec) return "N/A";
		const m = Math.floor(sec / 60);
		const s = Math.floor(sec % 60);
		return `${m}:${s.toString().padStart(2, "0")}`;
	};

	const togglePlayback = () => {
		if (!audioRef.current) return;

		if (isPlaying) {
			audioRef.current.pause();
			setIsPlaying(false);
		} else {
			audioRef.current.play();
			setIsPlaying(true);
		}
	};

	// Update playback progress
	useEffect(() => {
		const audio = audioRef.current;
		if (!audio) return;

		const update = () => {
			if (audio.duration) {
				setAudioProgress((audio.currentTime / audio.duration) * 100);
			}
		};

		const end = () => {
			setIsPlaying(false);
			setAudioProgress(0);
		};

		audio.addEventListener("timeupdate", update);
		audio.addEventListener("ended", end);

		return () => {
			audio.removeEventListener("timeupdate", update);
			audio.removeEventListener("ended", end);
		};
	}, []);

	// 🚀 Download helper (always authenticated)
	const downloadPDF = async (type, filename) => {
		try {
			const token = localStorage.getItem("token");
			if (!token) {
				alert("Login again — missing authentication.");
				return;
			}

			const url = `/api/recordings/${id}/pdf/${type}`;

			const res = await fetch(url, {
				headers: {
					Authorization: `Bearer ${token}`,
				},
			});

			if (!res.ok) {
				alert(`Failed to download (${res.status})`);
				return;
			}

			const blob = await res.blob();

			const link = document.createElement("a");
			link.href = window.URL.createObjectURL(blob);
			link.download = filename || `${type}.pdf`;
			link.click();

			window.URL.revokeObjectURL(link.href);
		} catch (err) {
			console.error(err);
			alert("Failed to download PDF.");
		}
	};

	if (loading) {
		return (
			<div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
				<div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600"></div>
			</div>
		);
	}

	if (error || !recording) {
		return (
			<div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6 transition-colors duration-200">
				<div className="max-w-xl mx-auto bg-red-50 dark:bg-red-900/20 p-6 rounded border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400">
					{error || "Recording not found"}
				</div>
				<button
					onClick={() => navigate("/dashboard")}
					className="mt-4 text-primary-600 dark:text-primary-400 flex items-center hover:text-primary-700 dark:hover:text-primary-300"
				>
					<ArrowLeft className="w-4 h-4 mr-1" /> Back
				</button>
			</div>
		);
	}

	// -------------------------
	// UI STARTS
	// -------------------------
	return (
		<div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
			{/* HEADER */}
			<header className="bg-white dark:bg-gray-800 shadow-sm transition-colors duration-200">
				<div className="max-w-7xl mx-auto p-4 flex items-center justify-between">
					<button
						onClick={() => navigate("/dashboard")}
						className="flex items-center text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white"
					>
						<ArrowLeft className="w-5 h-5 mr-2" />
						Back
					</button>
					<h1 className="text-2xl font-bold text-gray-900 dark:text-white">{recording.title}</h1>
					<button
						onClick={toggleDarkMode}
						className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition"
						title={darkMode ? 'Light mode' : 'Dark mode'}
					>
						{darkMode ? (
							<Sun className="w-5 h-5 text-yellow-500" />
						) : (
							<Moon className="w-5 h-5 text-gray-600" />
						)}
					</button>
				</div>
			</header>

			{/* MAIN */}
			<main className="max-w-7xl mx-auto p-6">
				{/* INFO SECTION */}
				<div className="bg-white dark:bg-gray-800 shadow p-6 rounded mb-6 grid grid-cols-1 md:grid-cols-3 gap-4 transition-colors duration-200">
					<div className="flex items-center space-x-3">
						<Calendar className="w-5 h-5 text-gray-400 dark:text-gray-500" />
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">Created</p>
							<p className="font-medium text-gray-900 dark:text-white">{formatDate(recording.created_at)}</p>
						</div>
					</div>
					<div className="flex items-center space-x-3">
						<Clock className="w-5 h-5 text-gray-400 dark:text-gray-500" />
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">Duration</p>
							<p className="font-medium text-gray-900 dark:text-white">
								{formatDuration(recording.duration)}
							</p>
						</div>
					</div>
					<div className="flex items-center space-x-3">
						<FileText className="w-5 h-5 text-gray-400 dark:text-gray-500" />
						<div>
							<p className="text-sm text-gray-500 dark:text-gray-400">Status</p>
							<p
								className={`font-medium ${
									recording.status === "completed"
										? "text-green-600 dark:text-green-400"
										: recording.status === "processing"
										? "text-yellow-600 dark:text-yellow-400"
										: "text-red-600 dark:text-red-400"
								}`}
							>
								{recording.status}
							</p>
						</div>
					</div>
				</div>

				{/* AUDIO PLAYER */}
				{recording.audio_file_path && (
					<div className="bg-white dark:bg-gray-800 p-6 shadow rounded mb-6 transition-colors duration-200">
						<h2 className="text-lg font-semibold mb-4 flex items-center text-gray-900 dark:text-white">
							<Volume2 className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
							Audio Playback
						</h2>

						<audio ref={audioRef} className="hidden" />

						<div className="flex items-center space-x-4">
							<button
								onClick={togglePlayback}
								className="w-12 h-12 bg-primary-600 hover:bg-primary-700 text-white rounded-full flex items-center justify-center transition shadow-lg hover:shadow-xl"
							>
								{isPlaying ? (
									<Pause className="w-6 h-6" />
								) : (
									<Play className="w-6 h-6 ml-1" />
								)}
							</button>

							<div className="flex-1">
								<div className="w-full bg-gray-200 dark:bg-gray-700 h-2 rounded-full">
									<div
										className="bg-primary-600 dark:bg-primary-500 h-2 rounded-full transition-all duration-200"
										style={{ width: `${audioProgress}%` }}
									></div>
								</div>
							</div>
						</div>
					</div>
				)}

				{/* PDF DOWNLOAD SECTION */}
				<div className="bg-white dark:bg-gray-800 shadow p-6 rounded mb-6 transition-colors duration-200">
					<h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
						<FileDown className="w-5 h-5 mr-2 text-primary-600 dark:text-primary-400" />
						Download PDFs
					</h2>

					<div className="grid md:grid-cols-2 gap-6">
						{/* Transcript */}
						{recording.transcript_pdf_path && (
							<div>
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">
									Transcript filename
								</label>
								<input
									type="text"
									value={transcriptFilename}
									onChange={(e) => setTranscriptFilename(e.target.value)}
									className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full mt-1 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
									placeholder="transcript.pdf"
								/>
								<button
									onClick={() => downloadPDF("transcript", transcriptFilename)}
									className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition w-full justify-center"
								>
									<Download className="w-4 h-4" />
									<span>Download Transcript PDF</span>
								</button>
							</div>
						)}

						{/* Summary */}
						{recording.summary_pdf_path && (
							<div>
								<label className="text-sm font-medium text-gray-700 dark:text-gray-300">Summary filename</label>
								<input
									type="text"
									value={summaryFilename}
									onChange={(e) => setSummaryFilename(e.target.value)}
									className="border border-gray-300 dark:border-gray-600 p-2 rounded w-full mt-1 mb-3 bg-white dark:bg-gray-700 text-gray-900 dark:text-white transition-colors duration-200"
									placeholder="summary.pdf"
								/>
								<button
									onClick={() => downloadPDF("summary", summaryFilename)}
									className="flex items-center space-x-2 bg-primary-600 text-white px-4 py-2 rounded hover:bg-primary-700 transition w-full justify-center"
								>
									<Download className="w-4 h-4" />
									<span>Download Summary PDF</span>
								</button>
							</div>
						)}
					</div>
				</div>

				{/* TRANSCRIPT + SUMMARY TABS */}
				<div className="bg-white dark:bg-gray-800 rounded shadow transition-colors duration-200">
					<div className="border-b dark:border-gray-700 flex">
						<button
							className={`px-6 py-4 border-b-2 font-medium transition ${
								activeTab === "transcript"
									? "border-primary-500 text-primary-600 dark:text-primary-400"
									: "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
							}`}
							onClick={() => setActiveTab("transcript")}
						>
							Transcript
						</button>
						<button
							className={`px-6 py-4 border-b-2 font-medium transition ${
								activeTab === "summary"
									? "border-primary-500 text-primary-600 dark:text-primary-400"
									: "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
							}`}
							onClick={() => setActiveTab("summary")}
						>
							Summary
						</button>
					</div>

					<div className="p-6">
						{activeTab === "transcript" && (
							<pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-6 rounded text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-colors duration-200 leading-relaxed">
								{recording.transcript || "No transcript available"}
							</pre>
						)}

						{activeTab === "summary" && (
							<pre className="whitespace-pre-wrap bg-gray-50 dark:bg-gray-900 p-6 rounded text-gray-800 dark:text-gray-200 border border-gray-200 dark:border-gray-700 transition-colors duration-200 leading-relaxed">
								{recording.summary || "No summary available"}
							</pre>
						)}
					</div>
				</div>
			</main>
		</div>
	);
};

export default RecordingDetail;
