import React, { createContext, useContext, useState, useRef, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { supabase } from "../services/supabase";

const PatientContext = createContext({
  patient: null,
  patientDetails: {},
  medications: [],
  notes: [],
  labResults: [],
  allergies: [],
  appointments: [],
  profileImage: null,
  loading: false,
  loadPatient: async () => {},
  updateProfileImage: async () => {},
  logout: () => {},
});

export function PatientProvider({ children }) {
  const [patient, setPatient] = useState(null);
  const [patientDetails, setPatientDetails] = useState({});
  const [medications, setMedications] = useState([]);
  const [notes, setNotes] = useState([]);
  const [labResults, setLabResults] = useState([]);
  const [allergies, setAllergies] = useState([]);
  const [appointments, setAppointments] = useState([]);
  const [profileImage, setProfileImage] = useState(null);
  const [loading, setLoading] = useState(false);

  const channelRef = useRef(null);
  const pollRef = useRef(null);
  const patientIdRef = useRef(null);
  const profileIdRef = useRef(null);

  /* ─── refetch helpers ─── */

  async function refetchAll(patientId) {
    const [medsRes, notesRes, resultsRes, allergiesRes, apptRes] = await Promise.all([
      supabase.from("medications").select("id, name, dosage, frequency, created_at").eq("patient_id", patientId).order("created_at", { ascending: false }),
      supabase.from("clinical_notes").select("id, note_text, visit_date").eq("patient_id", patientId).order("visit_date", { ascending: false }),
      supabase.from("lab_results").select("id, test_name, result_value, status, test_date").eq("patient_id", patientId).order("test_date", { ascending: false }),
      supabase.from("allergies").select("id, allergen, severity").eq("patient_id", patientId),
      supabase.from("appointments").select("id, doctor_id, appointment_time, reason, status, doctor:doctor_id(full_name)").eq("patient_id", patientId).order("appointment_time", { ascending: true }),
    ]);
    if (medsRes.data) setMedications(medsRes.data);
    if (notesRes.data) setNotes(notesRes.data);
    if (resultsRes.data) setLabResults(resultsRes.data);
    if (allergiesRes.data) setAllergies(allergiesRes.data);
    if (apptRes.data) setAppointments(apptRes.data);
  }

  async function refetchMedications(patientId) {
    const { data } = await supabase.from("medications").select("id, name, dosage, frequency, created_at").eq("patient_id", patientId).order("created_at", { ascending: false });
    if (data) setMedications(data);
  }

  async function refetchNotes(patientId) {
    const { data } = await supabase.from("clinical_notes").select("id, note_text, visit_date").eq("patient_id", patientId).order("visit_date", { ascending: false });
    if (data) setNotes(data);
  }

  async function refetchLabResults(patientId) {
    const { data } = await supabase.from("lab_results").select("id, test_name, result_value, status, test_date").eq("patient_id", patientId).order("test_date", { ascending: false });
    if (data) setLabResults(data);
  }

  async function refetchAllergies(patientId) {
    const { data } = await supabase.from("allergies").select("id, allergen, severity").eq("patient_id", patientId);
    if (data) setAllergies(data);
  }

  async function refetchAppointments(patientId) {
    const { data } = await supabase.from("appointments").select("id, doctor_id, appointment_time, reason, status, doctor:doctor_id(full_name)").eq("patient_id", patientId).order("appointment_time", { ascending: true });
    if (data) setAppointments(data);
  }

  async function refetchPatientDetails(patientId) {
    const { data } = await supabase.from("patients").select("*").eq("id", patientId).single();
    if (data) setPatientDetails(data);
  }

  async function refetchProfile(profileId) {
    const { data } = await supabase.from("profiles").select("id, full_name, medlife_id, created_at").eq("id", profileId).single();
    if (data) setPatient((prev) => ({ ...prev, ...data }));
  }

  /* ─── polling: refetch all clinical data every 5 s ─── */

  function startPolling(patientId) {
    stopPolling();
    pollRef.current = setInterval(() => {
      refetchAll(patientId);
    }, 5000);
  }

  function stopPolling() {
    if (pollRef.current) {
      clearInterval(pollRef.current);
      pollRef.current = null;
    }
  }

  /* ─── realtime subscriptions (instant push) ─── */

  function setupRealtimeSubscriptions(patientId, profileId) {
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }

    patientIdRef.current = patientId;
    profileIdRef.current = profileId;

    const channel = supabase
      .channel("patient-realtime-" + patientId)

      .on("postgres_changes", { event: "*", schema: "public", table: "medications" }, (payload) => {
        const row = payload.new || payload.old || {};
        if (!row.patient_id || row.patient_id === patientId) refetchMedications(patientId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "clinical_notes" }, (payload) => {
        const row = payload.new || payload.old || {};
        if (!row.patient_id || row.patient_id === patientId) refetchNotes(patientId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "lab_results" }, (payload) => {
        const row = payload.new || payload.old || {};
        if (!row.patient_id || row.patient_id === patientId) refetchLabResults(patientId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "allergies" }, (payload) => {
        const row = payload.new || payload.old || {};
        if (!row.patient_id || row.patient_id === patientId) refetchAllergies(patientId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "appointments" }, (payload) => {
        const row = payload.new || payload.old || {};
        if (!row.patient_id || row.patient_id === patientId) refetchAppointments(patientId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "patients" }, (payload) => {
        const row = payload.new || payload.old || {};
        if (!row.id || row.id === patientId) refetchPatientDetails(patientId);
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "profiles" }, (payload) => {
        const row = payload.new || payload.old || {};
        if (!row.id || row.id === profileId) refetchProfile(profileId);
      })
      .subscribe((status) => {
        if (status === "SUBSCRIBED") {
          refetchAll(patientId);
        }
      });

    channelRef.current = channel;
  }

  /* ─── load patient on login ─── */

  async function loadPatient(profileId, email) {
    setLoading(true);
    try {
      const [profileRes, patientsRes] = await Promise.all([
        supabase.from("profiles").select("id, full_name, medlife_id, created_at").eq("id", profileId).single(),
        supabase.from("patients").select("*").eq("id", profileId).single(),
      ]);

      const profile = profileRes.data ?? {};
      const details = patientsRes.data ?? {};
      const patientId = details.id ?? profileId;

      setPatient({ ...profile, email });
      setPatientDetails(details);

      await AsyncStorage.setItem("SESSION_PROFILE_ID", profileId);
      await AsyncStorage.setItem("SESSION_EMAIL", email);

      try {
        const savedImg = await AsyncStorage.getItem("PROFILE_IMAGE_" + profileId);
        const isValidUri = savedImg && (
          savedImg.startsWith("http") ||
          savedImg.startsWith("file://") ||
          savedImg.startsWith("content://")
        );
        setProfileImage(isValidUri ? savedImg : null);
        if (!isValidUri && savedImg) await AsyncStorage.removeItem("PROFILE_IMAGE_" + profileId);
      } catch (_) {}

      await refetchAll(patientId);

      setupRealtimeSubscriptions(patientId, profileId);
      startPolling(patientId);
    } catch (e) {
      console.error("loadPatient error:", e);
    }
    setLoading(false);
  }

  /* ─── profile image ─── */

  async function updateProfileImage(uri, profileId) {
    setProfileImage(uri);
    try {
      if (uri) await AsyncStorage.setItem("PROFILE_IMAGE_" + profileId, uri);
      else await AsyncStorage.removeItem("PROFILE_IMAGE_" + profileId);
    } catch (e) {
      console.error("saveImage error:", e);
    }
  }

  /* ─── logout ─── */

  async function logout() {
    stopPolling();
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
      channelRef.current = null;
    }
    patientIdRef.current = null;
    profileIdRef.current = null;

    await AsyncStorage.removeItem("USER_SESSION");

    setPatient(null);
    setPatientDetails({});
    setMedications([]);
    setNotes([]);
    setLabResults([]);
    setAllergies([]);
    setAppointments([]);
    setProfileImage(null);
  }

  /* ─── cleanup on unmount ─── */

  useEffect(() => {
    return () => {
      stopPolling();
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return (
    <PatientContext.Provider
      value={{
        patient,
        patientDetails,
        medications,
        notes,
        labResults,
        allergies,
        appointments,
        profileImage,
        updateProfileImage,
        loading,
        loadPatient,
        logout,
      }}
    >
      {children}
    </PatientContext.Provider>
  );
}

export function usePatient() {
  return useContext(PatientContext);
}
