import { useState, useEffect, useRef, useCallback } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  confirmPasswordReset,
  signOut,
  onAuthStateChanged,
  updateProfile,
} from "firebase/auth";
import {
  collection,
  addDoc,
  query,
  where,
  onSnapshot,
  doc,
  setDoc,
  getDoc,
  getDocs,
  writeBatch,
  serverTimestamp,
  orderBy,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";
import { auth, db } from "./firebase";

const AVATARS = [
  { id: "cat",     src: "/pic/icon/猫.png",       label: "猫" },
  { id: "dog",     src: "/pic/icon/犬.png",       label: "犬" },
  { id: "rabbit",  src: "/pic/icon/うさぎ.png",   label: "うさぎ" },
  { id: "tanuki",  src: "/pic/icon/たぬき.png",   label: "たぬき" },
  { id: "tiger",   src: "/pic/icon/トラ.png",     label: "トラ" },
  { id: "penguin", src: "/pic/icon/ペンギン.png", label: "ペンギン" },
  { id: "cow",     src: "/pic/icon/牛.png",       label: "牛" },
  { id: "sheep",   src: "/pic/icon/羊.png",       label: "羊" },
  { id: "elephant",src: "/pic/icon/ゾウ.png",     label: "ゾウ" },
  { id: "raccoon", src: "/pic/icon/アライグマ.png",label: "アライグマ" },
  { id: "frog",    src: "/pic/icon/カエル.png",   label: "カエル" },
  { id: "gorilla", src: "/pic/icon/ゴリラ.png",   label: "ゴリラ" },
  { id: "fox",src: "/pic/icon/キツネ.png",     label: "キツネ" },
  { id: "monkey", src: "/pic/icon/サル.png",label: "サル" },
  { id: "reindeer",    src: "/pic/icon/トナカイ.png",   label: "トナカイ" },
  { id: "leon", src: "/pic/icon/ライオン.png",   label: "ライオン" },
  { id: "crocodile", src: "/pic/icon/ワニ.png",   label: "ワニ" },
];

// アバターIDからsrcを取得するヘルパー
const getAvatarSrc = (avatarId) => {
  const found = AVATARS.find(a => a.id === avatarId);
  return found ? found.src : AVATARS[0].src;
};

const generateUserId = () => {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  const rand = Array.from({ length: 6 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
  return `nw-${rand}`;
};

export default function App() {
  const navigate = useNavigate();
  const [progress, setProgress] = useState(0);
  const [showProgress, setShowProgress] = useState(false);
  const progressTimer = useRef(null);
  const location = useLocation();
  const page = location.pathname.replace("/", "") || "login";
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [partnerProfile, setPartnerProfile] = useState(null);
  const [entries, setEntries] = useState([]);
  const [loginForm, setLoginForm] = useState({ email: "", password: "" });
  const [showResetPassword, setShowResetPassword] = useState(false);
  const [resetEmail, setResetEmail] = useState("");
  const [resetOobCode, setResetOobCode] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [newPasswordConfirm, setNewPasswordConfirm] = useState("");
  const [showNewPasswordModal, setShowNewPasswordModal] = useState(false);
  const [registerForm, setRegisterForm] = useState({ email: "", password: "", nickname: "", userId: "", avatar: "cat" });
  const [pairSearchId, setPairSearchId] = useState("");
  const [showQrScanner, setShowQrScanner] = useState(false);
  const myQrCanvasRef = useRef(null);
  const myQrCanvasRef2 = useRef(null);
  const [pendingPartner, setPendingPartner] = useState(null);
  const [editEntry, setEditEntry] = useState(null); // 修正中のエントリ
  const [deleteEntryId, setDeleteEntryId] = useState(null); // 削除確認中のエントリID // QR読み取り後の確認用
  const [qrMode, setQrMode] = useState("camera"); // "camera" | "file"
  const [qrError, setQrError] = useState("");
  const videoRef = useRef(null);
  const canvasRef = useRef(null);
  const streamRef = useRef(null);
  const animRef = useRef(null);
  const [form, setForm] = useState({ account: "", amount: "", note: "" });
  const [toast, setToast] = useState(null);
  const [loading, setLoading] = useState(false);
  const [previewId, setPreviewId] = useState(generateUserId());
  const [showSettleConfirm, setShowSettleConfirm] = useState(false);
  const [showUnpairConfirm, setShowUnpairConfirm] = useState(false);
  const [showMenu, setShowMenu] = useState(false);
  const [showAvatarPicker, setShowAvatarPicker] = useState(false);
  const [showProfile, setShowProfile] = useState(false);
  const [editForm, setEditForm] = useState({ nickname: "", userId: "" });
  const [showInviteModal, setShowInviteModal] = useState(false);
  const [showContact, setShowContact] = useState(false);
  const [contactForm, setContactForm] = useState({ type: "バグ報告", email: "", message: "" });
  const [contactSent, setContactSent] = useState(false);
  const [showDeleteAccount, setShowDeleteAccount] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState("");

  // Handle invite link and password reset on load
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const inviteId = params.get("invite");
    if (inviteId) setPairSearchId(inviteId);
    const mode = params.get("mode");
    const oobCode = params.get("oobCode");
    if (mode === "resetPassword" && oobCode) {
      setResetOobCode(oobCode);
      setShowNewPasswordModal(true);
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (user) => {
      if (user) {
        setCurrentUser(user);
        const profile = await fetchUserProfile(user.uid);
        setUserProfile(profile);
        if (profile?.pairedWith) {
          const partner = await fetchUserProfile(profile.pairedWith);
          setPartnerProfile(partner);
          navigate("/home");
        } else {
          navigate("/pair");
        }
      } else {
        setCurrentUser(null);
        setUserProfile(null);
        setPartnerProfile(null);
        navigate("/login");
      }
    });
    return () => unsub();
  }, []);

  // Listen to entries and auto-delete settled entries older than 6 months
  useEffect(() => {
    if (!userProfile?.pairedWith || !currentUser) return;
    const uids = [currentUser.uid, userProfile.pairedWith].sort();
    const pairId = uids.join("_");
    const q = query(
      collection(db, "entries"),
      where("pairId", "==", pairId),
      orderBy("createdAt", "desc")
    );
    const unsub = onSnapshot(q, async (snap) => {
      const now = new Date();
      const sixMonthsAgo = new Date(now);
      sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

      // Auto-delete settled entries older than 6 months
      const batch = writeBatch(db);
      let hasDeletes = false;
      snap.docs.forEach(d => {
        const data = d.data();
        if (data.settled && data.settledAt) {
          const settledDate = data.settledAt.toDate ? data.settledAt.toDate() : new Date(data.settledAt);
          if (settledDate < sixMonthsAgo) {
            batch.delete(doc(db, "entries", d.id));
            hasDeletes = true;
          }
        }
      });
      if (hasDeletes) await batch.commit();

      setEntries(snap.docs
        .filter(d => {
          const data = d.data();
          if (data.settled && data.settledAt) {
            const settledDate = data.settledAt.toDate ? data.settledAt.toDate() : new Date(data.settledAt);
            return settledDate >= sixMonthsAgo;
          }
          return true;
        })
        .map(d => ({ id: d.id, ...d.data() }))
      );
    });
    return () => unsub();
  }, [userProfile?.pairedWith, currentUser]);

  const fetchUserProfile = async (uid) => {
    const snap = await getDoc(doc(db, "users", uid));
    return snap.exists() ? { uid, ...snap.data() } : null;
  };

  const showToast = (msg, type = "success") => {
    setToast({ msg, type });
    setTimeout(() => setToast(null), 2800);
  };

  const handleRegister = async () => {
    if (!registerForm.email || !registerForm.password || !registerForm.nickname) {
      showToast("ニックネーム・メール・パスワードを入力してください", "error"); return;
    }
    setLoading(true); startProgress();
    try {
      const finalUserId = registerForm.userId.trim() !== "" ? registerForm.userId.trim() : previewId;
      const idCheck = await getDocs(query(collection(db, "users"), where("userId", "==", finalUserId)));
      if (!idCheck.empty) { showToast("このユーザーIDは既に使われています", "error"); stopProgress(); setLoading(false); return; }
      const cred = await createUserWithEmailAndPassword(auth, registerForm.email, registerForm.password);
      await updateProfile(cred.user, { displayName: registerForm.nickname });
      await setDoc(doc(db, "users", cred.user.uid), {
        nickname: registerForm.nickname,
        userId: finalUserId,
        email: registerForm.email,
        avatar: registerForm.avatar || "cat",
        pairedWith: null,
        createdAt: serverTimestamp(),
      });
      showToast("登録しました！");
    } catch (e) {
      showToast(e.code === "auth/email-already-in-use" ? "このメールは既に登録済みです" : e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  const handleConfirmPasswordReset = async () => {
    if (!newPassword) { showToast("新しいパスワードを入力してください", "error"); return; }
    if (newPassword.length < 6) { showToast("パスワードは6文字以上で入力してください", "error"); return; }
    if (newPassword !== newPasswordConfirm) { showToast("パスワードが一致しません", "error"); return; }
    setLoading(true); startProgress();
    try {
      await confirmPasswordReset(auth, resetOobCode, newPassword);
      showToast("パスワードを変更しました！ログインしてください");
      setShowNewPasswordModal(false);
      setNewPassword("");
      setNewPasswordConfirm("");
      navigate("/login");
    } catch(e) {
      showToast("リンクが無効か期限切れです。再度リセットメールを送ってください", "error");
    }
    stopProgress(); setLoading(false);
  };

  const startProgress = () => {
    setProgress(0);
    setShowProgress(true);
    let val = 0;
    progressTimer.current = setInterval(() => {
      val += Math.random() * 15;
      if (val >= 90) { val = 90; clearInterval(progressTimer.current); }
      setProgress(val);
    }, 150);
  };

  const stopProgress = () => {
    clearInterval(progressTimer.current);
    setProgress(100);
    setTimeout(() => setShowProgress(false), 400);
  };

  const handleResetPassword = async () => {
    if (!resetEmail.trim()) { showToast("メールアドレスを入力してください", "error"); return; }
    setLoading(true); startProgress();
    try {
      await sendPasswordResetEmail(auth, resetEmail.trim());
      showToast("パスワードリセットメールを送りました！");
      setShowResetPassword(false);
      setResetEmail("");
    } catch(e) {
      if (e.code === "auth/user-not-found") {
        showToast("このメールアドレスは登録されていません", "error");
      } else {
        showToast("送信に失敗しました。もう一度お試しください", "error");
      }
    }
    stopProgress(); setLoading(false);
  };

  const handleLogin = async () => {
    if (!loginForm.email || !loginForm.password) { showToast("入力してください", "error"); return; }
    setLoading(true); startProgress();
    try {
      await signInWithEmailAndPassword(auth, loginForm.email, loginForm.password);
      stopProgress();
      showToast("ログインしました");
    } catch (e) {
      stopProgress();
      showToast("メールまたはパスワードが違います", "error");
    }
    stopProgress(); setLoading(false);
  };

  // QRスキャナー停止
  // refで最新の currentUser を保持（useCallback の古い参照問題を回避）
  const currentUserRef = useRef(null);
  useEffect(() => { currentUserRef.current = currentUser; }, [currentUser]);

  const stopScanner = () => {
    if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null; }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(t => t.stop());
      streamRef.current = null;
    }
  };

  // QRコードをcanvasに描画
  const drawQr = (canvasEl, text) => {
    if (!canvasEl || !text || !window.QRCode) return;
    try {
      window.QRCode.toCanvas(canvasEl, text, {
        width: 200, margin: 2,
        color: { dark: "#3d3830", light: "#faf8f5" }
      });
    } catch(e) { console.error(e); }
  };

  useEffect(() => {
    if (!userProfile?.userId) return;
    const url = `${window.location.origin}?invite=${userProfile.userId}`;
    if (myQrCanvasRef.current) drawQr(myQrCanvasRef.current, url);
    if (myQrCanvasRef2.current) drawQr(myQrCanvasRef2.current, url);
  }, [userProfile?.userId, page]);

  // QR読み取り結果処理 → 確認画面へ
  const handleQrResult = async (data) => {
    stopScanner();
    setShowQrScanner(false);
    try {
      const url = new URL(data);
      const inviteId = url.searchParams.get("invite");
      if (!inviteId) { showToast("niwariの招待QRコードではありません", "error"); return; }
      setLoading(true); startProgress();
      const q = query(collection(db, "users"), where("userId", "==", inviteId.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { showToast("ユーザーが見つかりません", "error"); stopProgress(); setLoading(false); return; }
      const partnerDoc = snap.docs[0];
      if (partnerDoc.id === currentUserRef.current?.uid) {
        showToast("自分自身とはペアになれません", "error"); stopProgress(); setLoading(false); return;
      }
      setPendingPartner({ uid: partnerDoc.id, ...partnerDoc.data() });
      stopProgress(); setLoading(false);
    } catch(e) {
      console.error(e);
      showToast("QRコードを読み取れませんでした", "error");
      stopProgress(); setLoading(false);
    }
  };

  // refでhandleQrResultを保持（scanFrameのクロージャ問題を回避）
  const handleQrResultRef = useRef(handleQrResult);
  useEffect(() => { handleQrResultRef.current = handleQrResult; });

  // カメラ起動
  const startCamera = async () => {
    setQrError("");
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" }
      });
      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
        animRef.current = requestAnimationFrame(scanFrame);
      }
    } catch (e) {
      setQrError("カメラへのアクセスが拒否されました。設定から許可してください。");
    }
  };

  // QRコード解析ループ
  const scanFrame = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    if (video.readyState < video.HAVE_ENOUGH_DATA) {
      animRef.current = requestAnimationFrame(scanFrame);
      return;
    }
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    if (window.jsQR) {
      const code = window.jsQR(imageData.data, imageData.width, imageData.height, {
        inversionAttempts: "dontInvert",
      });
      if (code?.data) {
        handleQrResultRef.current(code.data);
        return;
      }
    }
    animRef.current = requestAnimationFrame(scanFrame);
  };

  // 確認後にペア登録
  const handleConfirmPair = async () => {
    if (!pendingPartner) return;
    setLoading(true); startProgress();
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", currentUser.uid), { pairedWith: pendingPartner.uid });
      batch.update(doc(db, "users", pendingPartner.uid), { pairedWith: currentUser.uid });
      await batch.commit();
      setPartnerProfile(pendingPartner);
      setUserProfile(prev => ({ ...prev, pairedWith: pendingPartner.uid }));
      setPendingPartner(null);
      navigate("/home");
      showToast(`${pendingPartner.nickname} さんとペアになりました！`);
    } catch(e) {
      showToast(e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  // ファイルからQR読み取り
  const handleQrFile = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const img = new Image();
      img.onload = () => {
        // 大きい画像はリサイズして精度向上
        const MAX = 1024;
        const scale = Math.min(1, MAX / Math.max(img.width, img.height));
        const w = Math.floor(img.width * scale);
        const h = Math.floor(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        const ctx = canvas.getContext("2d");
        ctx.drawImage(img, 0, 0, w, h);
        const imageData = ctx.getImageData(0, 0, w, h);
        if (!window.jsQR) {
          showToast("QRライブラリの読み込みに失敗しました", "error");
          setShowQrScanner(false);
          return;
        }
        // 通常・反転・両方の3パターンで試行
        const attempts = ["dontInvert", "onlyInvert", "attemptBoth"];
        let found = null;
        for (const inv of attempts) {
          const code = window.jsQR(imageData.data, w, h, { inversionAttempts: inv });
          if (code?.data) { found = code.data; break; }
        }
        setShowQrScanner(false);
        if (found) {
          handleQrResultRef.current(found);
        } else {
          showToast("QRコードが見つかりませんでした", "error");
        }
      };
      img.onerror = () => {
        showToast("画像の読み込みに失敗しました", "error");
        setShowQrScanner(false);
      };
      img.src = ev.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handlePair = async () => {
    if (!pairSearchId.trim()) { showToast("ユーザーIDを入力してください", "error"); return; }
    setLoading(true); startProgress();
    try {
      const q = query(collection(db, "users"), where("userId", "==", pairSearchId.trim()));
      const snap = await getDocs(q);
      if (snap.empty) { showToast("ユーザーが見つかりません", "error"); stopProgress(); setLoading(false); return; }
      const partnerDoc = snap.docs[0];
      const partnerId = partnerDoc.id;
      if (partnerId === currentUser.uid) { showToast("自分自身とはペアになれません", "error"); stopProgress(); setLoading(false); return; }
      await setDoc(doc(db, "users", currentUser.uid), { pairedWith: partnerId }, { merge: true });
      await setDoc(doc(db, "users", partnerId), { pairedWith: currentUser.uid }, { merge: true });
      const profile = await fetchUserProfile(currentUser.uid);
      const partner = await fetchUserProfile(partnerId);
      setUserProfile(profile);
      setPartnerProfile(partner);
      showToast(`${partner.nickname} さんとペアになりました！`);
      navigate("/home");
    } catch (e) {
      showToast(e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  const handleAdd = async () => {
    if (!form.amount || isNaN(Number(form.amount)) || Number(form.amount) <= 0) {
      showToast("正しい金額を入力してください", "error"); return;
    }
    setLoading(true); startProgress();
    try {
      const uids = [currentUser.uid, userProfile.pairedWith].sort();
      const pairId = uids.join("_");
      await addDoc(collection(db, "entries"), {
        pairId,
        userId: currentUser.uid,
        nickname: userProfile.nickname,
        avatar: userProfile.avatar || "cat",
        account: form.account,
        amount: Number(form.amount),
        note: form.note,
        settled: false,
        settledAt: null,
        createdAt: serverTimestamp(),
      });
      setForm({ account: "", amount: "", note: "" });
      showToast("記帳しました ✓");
    } catch (e) {
      showToast(e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  // Mark all unsettled entries as settled
  const handleSettle = async () => {
    setLoading(true); startProgress();
    try {
      const unsettled = entries.filter(e => !e.settled);
      if (unsettled.length === 0) { showToast("精算する記帳がありません", "error"); stopProgress(); setLoading(false); return; }
      const batch = writeBatch(db);
      const now = Timestamp.now();
      unsettled.forEach(e => {
        batch.update(doc(db, "entries", e.id), { settled: true, settledAt: now });
      });
      await batch.commit();
      setShowSettleConfirm(false);
      showToast("精算完了しました ✓");
    } catch (e) {
      showToast(e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  // Unpair both users
  const handleUnpair = async () => {
    setLoading(true); startProgress();
    try {
      const batch = writeBatch(db);
      batch.update(doc(db, "users", currentUser.uid), { pairedWith: null });
      if (userProfile?.pairedWith) {
        batch.update(doc(db, "users", userProfile.pairedWith), { pairedWith: null });
      }
      await batch.commit();
      setPartnerProfile(null);
      setEntries([]);
      setShowUnpairConfirm(false);
      const profile = await fetchUserProfile(currentUser.uid);
      setUserProfile(profile);
      showToast("ペアを解消しました");
      navigate("/pair");
    } catch (e) {
      showToast(e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  const openProfile = () => {
    setEditForm({ nickname: userProfile?.nickname || "", userId: userProfile?.userId || "" });
    setShowProfile(true);
  };

  const handleSaveProfile = async () => {
    if (!editForm.nickname.trim()) { showToast("ニックネームを入力してください", "error"); return; }
    if (!editForm.userId.trim()) { showToast("ユーザーIDを入力してください", "error"); return; }
    setLoading(true); startProgress();
    try {
      // Check userId uniqueness if changed
      if (editForm.userId.trim() !== userProfile.userId) {
        const idCheck = await getDocs(query(collection(db, "users"), where("userId", "==", editForm.userId.trim())));
        if (!idCheck.empty) { showToast("このユーザーIDは既に使われています", "error"); stopProgress(); setLoading(false); return; }
      }
      await setDoc(doc(db, "users", currentUser.uid), {
        nickname: editForm.nickname.trim(),
        userId: editForm.userId.trim(),
      }, { merge: true });
      setUserProfile(prev => ({ ...prev, nickname: editForm.nickname.trim(), userId: editForm.userId.trim() }));
      setShowProfile(false);
      showToast("プロフィールを更新しました ✓");
    } catch (e) {
      showToast(e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  const handleSaveAvatar = async (emoji) => {
    try {
      await setDoc(doc(db, "users", currentUser.uid), { avatar: emoji }, { merge: true });
      setUserProfile(prev => ({ ...prev, avatar: emoji }));
      // Also update entries in memory to reflect new avatar
      setEntries(prev => prev.map(e => e.userId === currentUser.uid ? { ...e, avatar: emoji } : e));
      setShowAvatarPicker(false);
      showToast("アイコンを変更しました ✓");
    } catch (e) {
      showToast(e.message, "error");
    }
  };

  const handleContact = async () => {
    if (!contactForm.email.trim()) { showToast("メールアドレスを入力してください", "error"); return; }
    if (!contactForm.message.trim()) { showToast("お問い合わせ内容を入力してください", "error"); return; }
    setLoading(true); startProgress();
    try {
      await addDoc(collection(db, "contacts"), {
        type: contactForm.type,
        email: contactForm.email.trim(),
        message: contactForm.message.trim(),
        userId: currentUser?.uid || null,
        nickname: userProfile?.nickname || null,
        createdAt: serverTimestamp(),
      });
      setContactSent(true);
      setContactForm({ type: "バグ報告", email: "", message: "" });
    } catch (e) {
      showToast(e.message, "error");
    }
    stopProgress(); setLoading(false);
  };

  const handleDeleteAccount = async () => {
    if (deleteConfirmText !== "削除") { showToast("「削除」と入力してください", "error"); return; }
    setLoading(true); startProgress();
    try {
      const uid = currentUser.uid;
      // ペア相手のpairedWithをnullに
      if (userProfile?.pairedWith) {
        await setDoc(doc(db, "users", userProfile.pairedWith), { pairedWith: null }, { merge: true });
      }
      // 自分のentriesを削除
      const pairId = userProfile?.pairedWith
        ? [uid, userProfile.pairedWith].sort().join("_")
        : null;
      if (pairId) {
        const entSnap = await getDocs(query(collection(db, "entries"), where("pairId", "==", pairId), where("userId", "==", uid)));
        for (const d of entSnap.docs) await deleteDoc(doc(db, "entries", d.id));
      }
      // usersドキュメント削除
      await deleteDoc(doc(db, "users", uid));
      // Authアカウント削除
      await currentUser.delete();
      showToast("アカウントを削除しました");
    } catch (e) {
      if (e.code === "auth/requires-recent-login") {
        showToast("セキュリティのため再ログインが必要です。一度ログアウトして再度ログインしてから削除してください。", "error");
      } else {
        showToast(e.message, "error");
      }
    }
    stopProgress(); setLoading(false);
    setShowDeleteAccount(false);
  };

  const handleEditEntry = async () => {
    if (!editEntry.account.trim()) { showToast("科目を入力してください", "error"); return; }
    if (!editEntry.amount || isNaN(editEntry.amount)) { showToast("金額を入力してください", "error"); return; }
    setLoading(true); startProgress();
    try {
      await setDoc(doc(db, "entries", editEntry.id), {
        account: editEntry.account.trim(),
        amount: parseInt(editEntry.amount),
        note: editEntry.note || "",
      }, { merge: true });
      setEntries(prev => prev.map(e => e.id === editEntry.id
        ? { ...e, account: editEntry.account.trim(), amount: parseInt(editEntry.amount), note: editEntry.note || "" }
        : e
      ));
      setEditEntry(null);
      showToast("修正しました");
    } catch(e) { showToast(e.message, "error"); }
    stopProgress(); setLoading(false);
  };

  const handleDeleteEntry = async () => {
    if (!deleteEntryId) return;
    setLoading(true); startProgress();
    try {
      await deleteDoc(doc(db, "entries", deleteEntryId));
      setEntries(prev => prev.filter(e => e.id !== deleteEntryId));
      setDeleteEntryId(null);
      showToast("削除しました");
    } catch(e) { showToast(e.message, "error"); }
    stopProgress(); setLoading(false);
  };

  const handleLogout = async () => {
    await signOut(auth);
    showToast("ログアウトしました");
  };

  const unsettledEntries = entries.filter(e => !e.settled);
  const settledEntries = entries.filter(e => e.settled);
  const myTotal = unsettledEntries.filter(e => e.userId === currentUser?.uid).reduce((s, e) => s + e.amount, 0);
  const partnerTotal = unsettledEntries.filter(e => e.userId === userProfile?.pairedWith).reduce((s, e) => s + e.amount, 0);
  const diff = myTotal - partnerTotal;
  const effectiveUserId = registerForm.userId.trim() !== "" ? registerForm.userId.trim() : previewId;

  return (
    <>
      {showProgress && (
        <div style={{
          position:"fixed", top:0, left:0, right:0, zIndex:9999,
          height:3, pointerEvents:"none",
        }}>
          <div style={{
            height:"100%",
            width:`${progress}%`,
            background:"linear-gradient(90deg,#7a9e7e,#5d8a62)",
            borderRadius:"0 2px 2px 0",
            transition:"width 0.2s ease",
            boxShadow:"0 0 8px rgba(93,138,98,0.5)",
          }} />
        </div>
      )}
      <style>{`
        *, *::before, *::after { box-sizing: border-box; margin: 0; padding: 0; }
        html, body, #root {
          width: 100%; min-height: 100vh;
          background: #f5f2ee;
          font-family: 'Hiragino Kaku Gothic ProN', 'Noto Sans JP', 'Yu Gothic', sans-serif;
          color: #3d3830;
        }
        @keyframes fadeDown { from{opacity:0;transform:translateY(-10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideUp  { from{opacity:0;transform:translateY(20px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn   { from{opacity:0} to{opacity:1} }
        .toast {
          position:fixed; top:24px; left:50%; transform:translateX(-50%);
          padding:10px 28px; border-radius:40px; font-size:14px; font-weight:600;
          z-index:9999; box-shadow:0 4px 24px rgba(0,0,0,0.15);
          animation:fadeDown 0.25s ease; white-space:nowrap;
        }
        .card {
          background:#fff; border:1px solid #e8e2d9;
          border-radius:20px; box-shadow:0 2px 16px rgba(61,56,48,0.06);
        }
        .btn-primary {
          background:linear-gradient(135deg,#7a9e7e,#5d8a62); border:none; color:#fff;
          border-radius:12px; padding:13px 24px; font-size:15px; font-weight:700;
          cursor:pointer; width:100%; transition:opacity 0.2s;
        }
        .btn-primary:hover { opacity:0.88; }
        .btn-primary:disabled { opacity:0.5; cursor:not-allowed; }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
        .spinner {
          display: inline-block;
          width: 18px; height: 18px;
          border: 2.5px solid rgba(255,255,255,0.4);
          border-top-color: #fff;
          border-radius: 50%;
          animation: spin 0.7s linear infinite;
          vertical-align: middle;
          margin-right: 8px;
        }
        .btn-ghost .spinner {
          border-color: rgba(93,138,98,0.3);
          border-top-color: #5d8a62;
        }
        .btn-ghost {
          background:#f5f2ee; border:1px solid #ddd8cf;
          color:#3d3830; border-radius:12px; padding:13px 24px; font-size:15px; font-weight:600;
          cursor:pointer; width:100%; transition:background 0.2s;
        }
        .btn-ghost:hover { background:#ede8e0; }
        .btn-danger {
          background:rgba(220,80,80,0.08); border:1px solid rgba(220,80,80,0.3);
          color:#c94f4f; border-radius:12px; padding:13px 24px; font-size:15px; font-weight:600;
          cursor:pointer; width:100%; transition:background 0.2s;
        }
        .btn-danger:hover { background:rgba(220,80,80,0.15); }
        .btn-settle {
          background:linear-gradient(135deg,#7a9e7e,#5d8a62); border:none; color:#fff;
          border-radius:12px; padding:13px 24px; font-size:15px; font-weight:700;
          cursor:pointer; width:100%; transition:opacity 0.2s;
        }
        .btn-settle:hover { opacity:0.88; }
        .btn-settle:disabled { opacity:0.4; cursor:not-allowed; }
        .form-field { display:flex; flex-direction:column; gap:6px; }
        .form-field label { font-size:12px; color:#8a8070; letter-spacing:0.5px; font-weight:600; }
        .form-field input, .form-field select {
          background:#faf8f5; border:1.5px solid #ddd8cf;
          border-radius:10px; padding:12px 14px; font-size:15px; color:#3d3830;
          outline:none; width:100%; transition:border-color 0.2s;
        }
        .form-field input:focus, .form-field select:focus { border-color:#7a9e7e; }
        .form-field input::placeholder { color:#b8b0a4; }
        .id-preview {
          display:flex; align-items:center; justify-content:space-between;
          background:rgba(122,158,126,0.1); border:1px dashed rgba(122,158,126,0.5);
          border-radius:10px; padding:12px 14px; margin-top:2px;
        }
        .entry-row {
          display:flex; justify-content:space-between; align-items:center;
          padding:12px 0; border-bottom:1px solid #f0ece6;
        }
        .entry-row:last-child { border-bottom:none; }
        .settled-badge {
          font-size:10px; font-weight:700; padding:2px 8px; border-radius:20px;
          background:rgba(122,158,126,0.15); color:#5d8a62; border:1px solid rgba(122,158,126,0.3);
          margin-left:8px;
        }
        .navbar {
          position:sticky; top:0; z-index:100;
          background:rgba(245,242,238,0.92); backdrop-filter:blur(20px);
          border-bottom:1px solid #e8e2d9;
          display:flex; align-items:center; justify-content:space-between;
          padding:0 40px; height:64px;
        }
        .menu-dropdown {
          position:absolute; top:60px; right:16px;
          background:#fff; border:1px solid #e8e2d9;
          border-radius:14px; padding:8px; min-width:180px;
          box-shadow:0 8px 32px rgba(61,56,48,0.12);
          animation:fadeDown 0.2s ease; z-index:200;
        }
        .menu-item {
          display:block; width:100%; text-align:left; padding:10px 14px;
          border:none; border-radius:8px; font-size:14px; font-weight:600;
          cursor:pointer; background:none; color:#3d3830; transition:background 0.15s;
        }
        .menu-item:hover { background:#f5f2ee; }
        @media (min-width:769px) { .hamburger { display:none !important; } .pc-nav { display:flex !important; } }
        @media (max-width:768px) { .hamburger { display:flex !important; } .pc-nav { display:none !important; } }
        .page-wrap { max-width:1200px; margin:0 auto; padding:36px 40px; }
        .grid-2 { display:grid; grid-template-columns:1fr 1fr; gap:24px; }
        .auth-wrap {
          min-height:100vh; display:flex;
          align-items:center; justify-content:center; padding:40px 20px;
          background: radial-gradient(ellipse at 30% 20%, rgba(122,158,126,0.12) 0%, transparent 60%),
                      radial-gradient(ellipse at 70% 80%, rgba(196,168,130,0.1) 0%, transparent 60%);
        }
        .auth-box { width:100%; max-width:480px; animation:slideUp 0.4s ease; }
        .modal-overlay {
          position:fixed; inset:0; background:rgba(61,56,48,0.5); z-index:1000;
          display:flex; align-items:center; justify-content:center; padding:20px;
          animation:fadeIn 0.2s ease;
        }
        .modal-box {
          background:#fff; border:1px solid #e8e2d9; border-radius:24px;
          padding:36px; max-width:440px; width:100%;
          box-shadow:0 20px 60px rgba(61,56,48,0.15);
        }
        @media (max-width:768px) {
          .navbar { padding:0 20px; }
          .page-wrap { padding:20px 16px; }
          .grid-2 { grid-template-columns:1fr; }
          .auth-wrap { padding:24px 16px; align-items:flex-start; padding-top:60px; }
        }
      `}</style>

      {/* Toast */}
      {toast && (
        <div className="toast" style={{ background: toast.type === "error" ? "#c94f4f" : "#7a9e7e", color:"#fff" }}>
          {toast.msg}
        </div>
      )}

      {/* ===== 精算完了確認モーダル ===== */}
      {showSettleConfirm && (
        <div className="modal-overlay" onClick={() => setShowSettleConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              
              <h3 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>精算完了にしますか？</h3>
              <p style={{ color:"#8a8070", fontSize:14, lineHeight:1.6 }}>
                未精算の記帳 <strong style={{color:"#5d8a62"}}>{unsettledEntries.length}件</strong> を精算済みにします。<br/>
                精算済みデータは <strong style={{color:"#5d8a62"}}>6ヶ月後</strong> に自動削除されます。
              </p>
            </div>
            {diff !== 0 && (
              <div style={{
                background: diff > 0 ? "rgba(122,158,126,0.1)" : "rgba(196,168,130,0.15)",
                border: `1px solid ${diff > 0 ? "rgba(122,158,126,0.4)" : "rgba(196,168,130,0.4)"}`,
                borderRadius:14, padding:"14px 18px", marginBottom:24, textAlign:"center",
              }}>
                <p style={{ fontSize:13, color:"#8a8070", marginBottom:4 }}>
                  {diff > 0 ? `${partnerProfile?.nickname} さんが支払う額` : `あなたが支払う額`}
                </p>
                <p style={{ fontSize:28, fontWeight:800, color: diff > 0 ? "#5d8a62" : "#c94f4f" }}>
                  ¥{Math.abs(diff).toLocaleString()}
                </p>
              </div>
            )}
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn-settle" onClick={handleSettle} disabled={loading}>
                {loading ? "処理中..." : "精算完了にする"}
              </button>
              <button className="btn-ghost" onClick={() => setShowSettleConfirm(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ペア解消確認モーダル ===== */}
      {showUnpairConfirm && (
        <div className="modal-overlay" onClick={() => setShowUnpairConfirm(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              
              <h3 style={{ fontSize:22, fontWeight:800, marginBottom:10 }}>ペアを解消しますか？</h3>
              <p style={{ color:"#8a8070", fontSize:14, lineHeight:1.6 }}>
                <strong style={{color:"#3d3830"}}>{partnerProfile?.nickname}</strong> さんとのペアを解除します。<br/>
                記帳データは削除されません。
              </p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn-danger" onClick={handleUnpair} disabled={loading}>
                {loading ? "処理中..." : "ペアを解消する"}
              </button>
              <button className="btn-ghost" onClick={() => setShowUnpairConfirm(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== アカウント削除確認モーダル ===== */}
      {showDeleteAccount && (
        <div className="modal-overlay" onClick={() => { setShowDeleteAccount(false); setDeleteConfirmText(""); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <div style={{ textAlign:"center", marginBottom:24 }}>
              
              <h3 style={{ fontSize:20, fontWeight:800, marginBottom:10, color:"#3d3830" }}>アカウントを削除しますか？</h3>
              <p style={{ color:"#8a8070", fontSize:14, lineHeight:1.7 }}>
                この操作は取り消せません。<br/>
                アカウント・記帳データがすべて削除されます。<br/>
                ペア中の場合はペアも解消されます。
              </p>
            </div>
            <div className="form-field" style={{ marginBottom:20 }}>
              <label>確認のため「削除」と入力してください</label>
              <input type="text" placeholder="削除"
                value={deleteConfirmText}
                onChange={e => setDeleteConfirmText(e.target.value)} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn-danger"
                onClick={handleDeleteAccount}
                disabled={loading || deleteConfirmText !== "削除"}>
                {loading ? "削除中..." : "アカウントを削除する"}
              </button>
              <button className="btn-ghost" onClick={() => { setShowDeleteAccount(false); setDeleteConfirmText(""); }}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== ペア確認モーダル ===== */}
      {pendingPartner && (
        <div className="modal-overlay" onClick={() => setPendingPartner(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign:"center" }}>
            <p style={{ fontSize:13, color:"#8a8070", marginBottom:20 }}>このユーザーとペアになりますか？</p>
            <div style={{
              background:"#faf8f5", border:"1.5px solid #e8e2d9",
              borderRadius:16, padding:"24px 20px", marginBottom:24,
              display:"flex", flexDirection:"column", alignItems:"center", gap:10,
            }}>
              <img src={getAvatarSrc(pendingPartner.avatar)} alt="avatar" style={{ width:72, height:72, objectFit:"contain" }} />
              <p style={{ fontSize:22, fontWeight:800, color:"#3d3830" }}>{pendingPartner.nickname}</p>
              <p style={{
                fontSize:13, color:"#5d8a62", fontWeight:600,
                background:"rgba(122,158,126,0.1)", border:"1px solid rgba(122,158,126,0.3)",
                borderRadius:20, padding:"4px 14px",
              }}>ID: {pendingPartner.userId}</p>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn-primary" onClick={handleConfirmPair} disabled={loading}>
                {loading ? "登録中..." : "ペアになる"}
              </button>
              <button className="btn-ghost" onClick={() => setPendingPartner(null)}>
                キャンセル
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 記帳修正モーダル ===== */}
      {editEntry && (
        <div className="modal-overlay" onClick={() => setEditEntry(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:24, color:"#3d3830" }}>記帳を修正</h3>
            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="form-field">
                <label>勘定科目</label>
                <input type="text" placeholder="例：食費"
                  value={editEntry.account}
                  onChange={e => setEditEntry({...editEntry, account: e.target.value})} />
              </div>
              <div className="form-field">
                <label>相手に請求する金額（円）</label>
                <input type="number" placeholder="例：1500"
                  value={editEntry.amount}
                  onChange={e => setEditEntry({...editEntry, amount: e.target.value})} />
              </div>
              <div className="form-field">
                <label>メモ（任意）</label>
                <input type="text" placeholder="例：ランチ代"
                  value={editEntry.note}
                  onChange={e => setEditEntry({...editEntry, note: e.target.value})} />
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
                <button className="btn-primary" onClick={handleEditEntry} disabled={loading}>
                  {loading ? "保存中..." : "保存する"}
                </button>
                <button className="btn-ghost" onClick={() => setEditEntry(null)}>キャンセル</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== 記帳削除確認モーダル ===== */}
      {deleteEntryId && (
        <div className="modal-overlay" onClick={() => setDeleteEntryId(null)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign:"center" }}>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:12, color:"#3d3830" }}>この記帳を削除しますか？</h3>
            <p style={{ color:"#8a8070", fontSize:14, marginBottom:24 }}>この操作は取り消せません。</p>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn-danger" onClick={handleDeleteEntry} disabled={loading}>
                {loading ? "削除中..." : "削除する"}
              </button>
              <button className="btn-ghost" onClick={() => setDeleteEntryId(null)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== 新パスワード入力モーダル ===== */}
      {showNewPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-box">
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:8, color:"#3d3830" }}>新しいパスワードを設定</h3>
            <p style={{ fontSize:13, color:"#8a8070", marginBottom:20, lineHeight:1.7 }}>
              新しいパスワードを入力してください。
            </p>
            <div style={{ display:"flex", flexDirection:"column", gap:14, marginBottom:20 }}>
              <div className="form-field">
                <label>新しいパスワード</label>
                <input type="password" placeholder="6文字以上"
                  value={newPassword} onChange={e => setNewPassword(e.target.value)} />
              </div>
              <div className="form-field">
                <label>確認用パスワード</label>
                <input type="password" placeholder="もう一度入力"
                  value={newPasswordConfirm} onChange={e => setNewPasswordConfirm(e.target.value)} />
              </div>
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn-primary" onClick={handleConfirmPasswordReset} disabled={loading}>
                {loading ? "変更中..." : "パスワードを変更する"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== パスワードリセットモーダル ===== */}
      {showResetPassword && (
        <div className="modal-overlay" onClick={() => setShowResetPassword(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:8, color:"#3d3830" }}>パスワードをリセット</h3>
            <p style={{ fontSize:13, color:"#8a8070", marginBottom:20, lineHeight:1.7 }}>
              登録したメールアドレスを入力してください。<br/>リセット用のリンクを送ります。
            </p>
            <div className="form-field" style={{ marginBottom:20 }}>
              <label>メールアドレス</label>
              <input type="email" placeholder="you@example.com"
                value={resetEmail} onChange={e => setResetEmail(e.target.value)} />
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button className="btn-primary" onClick={handleResetPassword} disabled={loading}>
                {loading ? "送信中..." : "リセットメールを送る"}
              </button>
              <button className="btn-ghost" onClick={() => setShowResetPassword(false)}>キャンセル</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== QRスキャナーモーダル ===== */}
      {showQrScanner && (
        <div className="modal-overlay" onClick={() => { stopScanner(); setShowQrScanner(false); }}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ maxWidth:360 }}>
            <h3 style={{ fontSize:18, fontWeight:800, marginBottom:16, color:"#3d3830" }}>QRコードを読み取る</h3>

            {/* モード切替 */}
            <div style={{ display:"flex", gap:8, marginBottom:16 }}>
              <button onClick={() => { setQrMode("camera"); setQrError(""); }} style={{
                flex:1, padding:"9px 0", borderRadius:10, fontSize:13, fontWeight:700,
                cursor:"pointer", border:"none",
                background: qrMode==="camera" ? "linear-gradient(135deg,#7a9e7e,#5d8a62)" : "#f5f2ee",
                color: qrMode==="camera" ? "#fff" : "#8a8070",
              }}>カメラ</button>
              <button onClick={() => { stopScanner(); setQrMode("file"); setQrError(""); }} style={{
                flex:1, padding:"9px 0", borderRadius:10, fontSize:13, fontWeight:700,
                cursor:"pointer", border:"none",
                background: qrMode==="file" ? "linear-gradient(135deg,#7a9e7e,#5d8a62)" : "#f5f2ee",
                color: qrMode==="file" ? "#fff" : "#8a8070",
              }}>アルバム</button>
            </div>

            {qrMode === "camera" && (
              <div>
                <div style={{ position:"relative", borderRadius:12, overflow:"hidden", background:"#000", marginBottom:12 }}>
                  <video ref={videoRef} style={{ width:"100%", display:"block" }}
                    onLoadedMetadata={() => {}}
                    playsInline muted />
                  <canvas ref={canvasRef} style={{ display:"none" }} />
                  {/* スキャンガイド枠 */}
                  <div style={{
                    position:"absolute", top:"50%", left:"50%",
                    transform:"translate(-50%,-50%)",
                    width:160, height:160,
                    border:"2px solid rgba(122,158,126,0.8)",
                    borderRadius:12,
                    boxShadow:"0 0 0 9999px rgba(0,0,0,0.4)",
                  }} />
                </div>
                {!streamRef.current && !qrError && (
                  <button className="btn-primary" onClick={startCamera}>カメラを起動する</button>
                )}
                {qrError && <p style={{ color:"#c94f4f", fontSize:13, textAlign:"center" }}>{qrError}</p>}
              </div>
            )}

            {qrMode === "file" && (
              <div style={{ textAlign:"center" }}>
                <p style={{ fontSize:13, color:"#8a8070", marginBottom:16 }}>
                  アルバムからQRコードの画像を選択してください
                </p>
                <label style={{
                  display:"block", padding:"40px 20px",
                  background:"#faf8f5", border:"2px dashed #ddd8cf",
                  borderRadius:12, cursor:"pointer", fontSize:32, marginBottom:12,
                }}>
                  <p style={{ fontSize:13, color:"#8a8070", marginTop:8 }}>タップして画像を選択</p>
                  <input type="file" accept="image/*" onChange={handleQrFile}
                    style={{ display:"none" }} />
                </label>
              </div>
            )}

            <button className="btn-ghost" style={{ marginTop:8 }}
              onClick={() => { stopScanner(); setShowQrScanner(false); }}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ===== QRコード招待モーダル ===== */}
      {showInviteModal && (
        <div className="modal-overlay" onClick={() => setShowInviteModal(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()} style={{ textAlign:"center" }}>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:8, color:"#3d3830" }}>招待QRコード</h3>
            <p style={{ fontSize:13, color:"#8a8070", marginBottom:24 }}>
              相手にこのQRコードを読み取ってもらいましょう
            </p>
            {userProfile?.userId && (
              <div style={{ display:"flex", justifyContent:"center", marginBottom:20 }}>
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(window.location.origin + "?invite=" + userProfile.userId)}&bgcolor=faf8f5&color=3d3830&margin=2`}
                  alt="QRコード"
                  style={{ width:200, height:200, borderRadius:12, border:"1.5px solid #e8e2d9" }}
                />
              </div>
            )}
            <div style={{
              background:"rgba(122,158,126,0.08)", border:"1px dashed rgba(122,158,126,0.4)",
              borderRadius:10, padding:"10px 14px", fontSize:12, color:"#5d8a62",
              wordBreak:"break-all", marginBottom:20, lineHeight:1.6,
            }}>
              {`${window.location.origin}?invite=${userProfile?.userId}`}
            </div>
            <div style={{ display:"flex", flexDirection:"column", gap:10 }}>
              <button onClick={() => {
                const url = `${window.location.origin}?invite=${userProfile.userId}`;
                navigator.clipboard.writeText(url);
                showToast("招待リンクをコピーしました！");
              }} className="btn-primary">リンクをコピー</button>
              <button className="btn-ghost" onClick={() => setShowInviteModal(false)}>閉じる</button>
            </div>
          </div>
        </div>
      )}

      {/* ===== プロフィール編集モーダル ===== */}
      {showProfile && (
        <div className="modal-overlay" onClick={() => setShowProfile(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:20, fontWeight:800, marginBottom:24, color:"#3d3830" }}>プロフィール編集</h3>

            {/* Current avatar */}
            <div style={{ display:"flex", alignItems:"center", gap:16, marginBottom:24,
              background:"#faf8f5", borderRadius:16, padding:"16px 20px",
              border:"1.5px solid #e8e2d9" }}>
              <img src={getAvatarSrc(userProfile?.avatar)} alt="avatar" style={{ width:56, height:56, objectFit:"contain" }} />
              <div>
                <p style={{ fontSize:13, color:"#8a8070", marginBottom:4 }}>アイコン</p>
                <button onClick={() => { setShowProfile(false); setShowAvatarPicker(true); }} style={{
                  background:"rgba(122,158,126,0.12)", border:"1px solid rgba(122,158,126,0.3)",
                  color:"#5d8a62", borderRadius:8, padding:"6px 14px",
                  fontSize:13, fontWeight:600, cursor:"pointer",
                }}>アイコンを変更</button>
              </div>
            </div>

            <div style={{ display:"flex", flexDirection:"column", gap:16 }}>
              <div className="form-field">
                <label>ニックネーム</label>
                <input type="text" placeholder="例：たろう"
                  value={editForm.nickname}
                  onChange={e => setEditForm({...editForm, nickname: e.target.value})} />
              </div>
              <div className="form-field">
                <label>ユーザーID</label>
                <input type="text" placeholder="例：nw-abc123"
                  value={editForm.userId}
                  onChange={e => setEditForm({...editForm, userId: e.target.value})} />
                <p style={{ fontSize:11, color:"#aaa098", marginTop:4 }}>
                  ※ IDを変更するとペア相手の検索IDも変わります
                </p>
              </div>
              <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
                <button className="btn-primary" onClick={handleSaveProfile} disabled={loading}>
                  {loading ? "保存中..." : "保存する"}
                </button>
                <button className="btn-ghost" onClick={() => setShowProfile(false)}>キャンセル</button>
              <button onClick={() => { setShowProfile(false); setShowDeleteAccount(true); }} style={{
                background:"none", border:"none", color:"#c94f4f",
                fontSize:13, cursor:"pointer", padding:"4px 0", textDecoration:"underline",
              }}>アカウントを削除する</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== アバター変更モーダル ===== */}
      {showAvatarPicker && (
        <div className="modal-overlay" onClick={() => setShowAvatarPicker(false)}>
          <div className="modal-box" onClick={e => e.stopPropagation()}>
            <h3 style={{ fontSize:18, fontWeight:800, marginBottom:20, color:"#3d3830" }}>アイコンを選択</h3>
            <div style={{ display:"flex", flexWrap:"wrap", gap:10, justifyContent:"center" }}>
              {AVATARS.map(av => (
                <button key={av.id} onClick={() => handleSaveAvatar(av.id)} style={{
                  width:60, height:60, borderRadius:12, border:"none", padding:4,
                  background: userProfile?.avatar===av.id ? "rgba(122,158,126,0.25)" : "#faf8f5",
                  outline: userProfile?.avatar===av.id ? "2px solid #7a9e7e" : "1.5px solid #ddd8cf",
                  cursor:"pointer", transition:"all 0.15s",
                }}>
                  <img src={av.src} alt={av.label} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                </button>
              ))}
            </div>
            <button className="btn-ghost" style={{ marginTop:20 }} onClick={() => setShowAvatarPicker(false)}>
              キャンセル
            </button>
          </div>
        </div>
      )}

      {/* ===== AUTH PAGES ===== */}
      {["login", "register", "pair"].includes(page) && (
        <div className="auth-wrap">
          <div className="auth-box">

            {/* LOGIN */}
            {page === "login" && (
              <>
                <div style={{ textAlign:"center", marginBottom:48 }}>
                  <img src="/pic/NIWARI.png" alt="niwari" style={{ width:280, maxWidth:"100%", marginBottom:8 }} />
                </div>
                <div className="card" style={{ padding:36, display:"flex", flexDirection:"column", gap:20 }}>
                  <div className="form-field">
                    <label>メールアドレス</label>
                    <input type="email" placeholder="you@example.com"
                      value={loginForm.email} onChange={e => setLoginForm({...loginForm, email:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>パスワード</label>
                    <input type="password" placeholder="••••••••"
                      value={loginForm.password} onChange={e => setLoginForm({...loginForm, password:e.target.value})} />
                  </div>
                  <div style={{ display:"flex", flexDirection:"column", gap:10, marginTop:8 }}>
                    <button className="btn-primary" onClick={handleLogin} disabled={loading}>{loading ? <><span className="spinner"/>"ログイン中..."</> : "ログイン"}</button>
                    <button className="btn-ghost" onClick={() => navigate("/register")}>新規登録</button>
                    <button type="button" onClick={() => { setResetEmail(loginForm.email); setShowResetPassword(true); }} style={{
                      background:"none", border:"none", color:"#9a9080",
                      fontSize:13, cursor:"pointer", padding:"4px 0", textDecoration:"underline",
                    }}>パスワードを忘れた場合</button>
                  </div>
                </div>
                {/* iPhone PWA hint */}
                <div style={{
                  marginTop:24, padding:"16px 20px",
                  background:"rgba(122,158,126,0.06)",
                  border:"1px solid rgba(122,158,126,0.15)",
                  borderRadius:16, display:"flex", alignItems:"flex-start", gap:12,
                }}>
                  
                  <div>
                    <p style={{ fontSize:13, fontWeight:700, marginBottom:4, color:"#3d3830" }}>iPhoneでアプリとして使う</p>
                    <p style={{ fontSize:12, color:"#9a9080", lineHeight:1.7 }}>
                      Safariでこのページを開き、画面下部の
                      <span style={{ color:"#3d3830", fontWeight:600 }}> 共有ボタン（四角に矢印）</span>
                      →
                      <span style={{ color:"#3d3830", fontWeight:600 }}>「ホーム画面に追加」</span>
                      を選択するとアプリとして追加できます。
                    </p>
                  </div>
                </div>
              </>
            )}

            {/* REGISTER */}
            {page === "register" && (
              <>
                <button onClick={() => navigate("/login")} style={{
                  background:"none", border:"none", color:"#8a8070",
                  fontSize:14, cursor:"pointer", marginBottom:24, padding:0,
                }}>← 戻る</button>
                <h2 style={{ fontSize:28, fontWeight:800, marginBottom:28 }}>新規登録</h2>
                <div className="card" style={{ padding:36, display:"flex", flexDirection:"column", gap:20 }}>
                  <div className="form-field">
                    <label>ニックネーム</label>
                    <input type="text" placeholder="例：たろう"
                      value={registerForm.nickname} onChange={e => setRegisterForm({...registerForm, nickname:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>アイコン</label>
                    <div style={{ display:"flex", flexWrap:"wrap", gap:10 }}>
                      {AVATARS.map(av => (
                        <button key={av.id} onClick={() => setRegisterForm({...registerForm, avatar:av.id})} style={{
                          width:52, height:52, borderRadius:12, border:"none", padding:4,
                          background: registerForm.avatar===av.id ? "rgba(122,158,126,0.25)" : "#faf8f5",
                          outline: registerForm.avatar===av.id ? "2px solid #7a9e7e" : "1.5px solid #ddd8cf",
                          cursor:"pointer", transition:"all 0.15s",
                        }}>
                          <img src={av.src} alt={av.label} style={{ width:"100%", height:"100%", objectFit:"contain" }} />
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="form-field">
                    <label>ユーザーID（空欄で自動生成）</label>
                    <input type="text" placeholder="例：taro-123"
                      value={registerForm.userId} onChange={e => setRegisterForm({...registerForm, userId:e.target.value})} />
                    <div className="id-preview">
                      <div>
                        <p style={{ fontSize:11, color:"#9a9080", marginBottom:3 }}>
                          {registerForm.userId.trim() ? "このIDで登録されます" : "自動生成されるID"}
                        </p>
                        <p style={{ fontSize:16, fontWeight:700, color:"#5d8a62", letterSpacing:1 }}>{effectiveUserId}</p>
                      </div>
                      {!registerForm.userId.trim() && (
                        <button onClick={() => setPreviewId(generateUserId())} style={{
                          background:"rgba(255,255,255,0.1)", border:"none", color:"#6b6358",
                          borderRadius:8, padding:"6px 12px", fontSize:12, cursor:"pointer",
                        }}>再生成</button>
                      )}
                    </div>
                    <p style={{ fontSize:11, color:"#aaa098", marginTop:4 }}>※ このIDを相手に教えてペアになります</p>
                  </div>
                  <div className="form-field">
                    <label>メールアドレス</label>
                    <input type="email" placeholder="you@example.com"
                      value={registerForm.email} onChange={e => setRegisterForm({...registerForm, email:e.target.value})} />
                  </div>
                  <div className="form-field">
                    <label>パスワード（6文字以上）</label>
                    <input type="password" placeholder="••••••••"
                      value={registerForm.password} onChange={e => setRegisterForm({...registerForm, password:e.target.value})} />
                  </div>
                  <button className="btn-primary" style={{ marginTop:8 }} onClick={handleRegister} disabled={loading}>
                    {loading ? <><span className="spinner"/>登録中...</> : "登録する"}
                  </button>
                </div>
              </>
            )}

            {/* PAIR */}
            {page === "pair" && (
              <>
                <div style={{ textAlign:"center", marginBottom:32 }}>
                  
                  <h2 style={{ fontSize:28, fontWeight:800 }}>ペアを登録する</h2>
                  <p style={{ color:"#8a8070", fontSize:14, marginTop:10, lineHeight:1.7 }}>
                    QRコードを相手に読み取ってもらうか、<br/>相手のQRコードを読み取りましょう。
                  </p>
                </div>

                <div className="card" style={{ padding:28, display:"flex", flexDirection:"column", gap:16 }}>
                  {/* 自分のQRコード表示 */}
                  {userProfile?.userId ? (
                    <>
                      <div style={{ textAlign:"center" }}>
                        <p style={{ fontSize:13, color:"#8a8070", marginBottom:12 }}>相手にこのQRコードを読み取ってもらう</p>
                        <div style={{ display:"flex", justifyContent:"center", marginBottom:12 }}>
                          <canvas ref={myQrCanvasRef}
                            style={{ width:200, height:200, borderRadius:12, border:"1.5px solid #e8e2d9" }}
                          />
                        </div>

                      </div>

                      <div style={{ borderTop:"1px solid #e8e2d9", paddingTop:16, textAlign:"center" }}>
                        <p style={{ fontSize:13, color:"#8a8070", marginBottom:12 }}>相手のQRコードを読み取る</p>
                        <button onClick={() => setShowQrScanner(true)} style={{
                          width:"100%", padding:"12px 0", borderRadius:10,
                          background:"linear-gradient(135deg,#7a9e7e,#5d8a62)", border:"none",
                          color:"#fff", fontSize:14, fontWeight:700, cursor:"pointer", marginBottom:10,
                        }}>QRコードを読み取る</button>
                        {pairSearchId && (
                          <button className="btn-primary" onClick={handlePair} disabled={loading}>
                            {loading ? "登録中..." : `ペアになる`}
                          </button>
                        )}
                      </div>
                    </>
                  ) : (
                    <p style={{ color:"#b8b0a4", fontSize:14, textAlign:"center" }}>読み込み中...</p>
                  )}

                  <button className="btn-ghost" onClick={handleLogout}>ログアウト</button>
                </div>
              </>
            )}
          </div>
        </div>
      )}

      {/* ===== HOME ===== */}
      {page === "home" && (
        <div style={{ minHeight:"100vh" }}>
          {/* Navbar */}
          <div className="navbar" style={{ position:"relative" }}>
            <img src="/pic/NIWARI.png" alt="niwari" style={{ height:36, objectFit:"contain" }} />

            {/* PC nav */}
            <div className="pc-nav" style={{ alignItems:"center", gap:16 }}>
              <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                <img src={getAvatarSrc(userProfile?.avatar)} alt="avatar" style={{ width:28, height:28, objectFit:"contain" }} />
                <span style={{ fontSize:14, color:"#6b6358", fontWeight:600 }}>{userProfile?.nickname}</span>
                <span style={{ fontSize:13, color:"#b8b0a4" }}>＆</span>
                <img src={getAvatarSrc(partnerProfile?.avatar)} alt="avatar" style={{ width:28, height:28, objectFit:"contain" }} />
                <span style={{ fontSize:14, color:"#6b6358", fontWeight:600 }}>{partnerProfile?.nickname}</span>
              </div>
              <button onClick={openProfile} style={{
                background:"rgba(122,158,126,0.1)", border:"1px solid rgba(122,158,126,0.3)",
                color:"#5d8a62", fontSize:13, cursor:"pointer", borderRadius:8, padding:"6px 14px", fontWeight:600,
              }}>プロフィール</button>
              <button onClick={() => setShowUnpairConfirm(true)} style={{
                background:"rgba(255,77,109,0.12)", border:"1px solid rgba(201,79,79,0.25)",
                color:"#c94f4f", fontSize:13, cursor:"pointer", borderRadius:8, padding:"6px 14px", fontWeight:600,
              }}>ペア解消</button>
              <button onClick={() => window.open('https://forms.gle/jsdKFSGNTmLPfNyj6', '_blank')} style={{
                background:"none", border:"1px solid #ddd8cf",
                color:"#8a8070", fontSize:13, cursor:"pointer", borderRadius:8, padding:"6px 14px",
              }}>お問い合わせ</button>
              <button onClick={handleLogout} style={{
                background:"#f0ece6", border:"1px solid #ddd8cf",
                color:"#5a5248", fontSize:13, cursor:"pointer", borderRadius:8, padding:"6px 16px",
              }}>ログアウト</button>
            </div>

            {/* Mobile hamburger */}
            <button className="hamburger" onClick={() => setShowMenu(v => !v)} style={{
              background:"none", border:"none", color:"#3d3830",
              fontSize:22, cursor:"pointer", padding:"4px 8px", lineHeight:1,
            }}>☰</button>

            {/* Mobile dropdown menu */}
            {showMenu && (
              <div className="menu-dropdown" onClick={() => setShowMenu(false)}>
                <div style={{ padding:"8px 14px 12px", borderBottom:"1px solid #f0ece6", marginBottom:6 }}>
                  <p style={{ fontSize:11, color:"#9a9080", marginBottom:6 }}>ペア中</p>
                  <div style={{ display:"flex", alignItems:"center", gap:8 }}>
                    <img src={getAvatarSrc(userProfile?.avatar)} alt="avatar" style={{ width:32, height:32, objectFit:"contain" }} />
                    <span style={{ fontSize:13, fontWeight:700, color:"#3d3830" }}>{userProfile?.nickname}</span>
                    <span style={{ color:"#b8b0a4" }}>＆</span>
                    <img src={getAvatarSrc(partnerProfile?.avatar)} alt="avatar" style={{ width:32, height:32, objectFit:"contain" }} />
                    <span style={{ fontSize:13, fontWeight:700, color:"#3d3830" }}>{partnerProfile?.nickname}</span>
                  </div>
                </div>
                <button className="menu-item" style={{ color:"#5d8a62" }}
                  onClick={() => { setShowMenu(false); openProfile(); }}>プロフィール編集</button>
                <button className="menu-item" style={{ color:"#c94f4f" }}
                  onClick={() => setShowUnpairConfirm(true)}>ペア解消</button>
                <button className="menu-item" style={{ color:"#8a8070" }}
                  onClick={() => window.open('https://forms.gle/jsdKFSGNTmLPfNyj6', '_blank')}>お問い合わせ</button>
                <button className="menu-item" style={{ color:"#5a5248" }}
                  onClick={handleLogout}>ログアウト</button>
                <div style={{ borderTop:"1px solid #f0ece6", marginTop:4, paddingTop:4 }}>
                  <button className="menu-item" style={{ color:"#c94f4f", fontSize:13 }}
                    onClick={() => { setShowMenu(false); setShowDeleteAccount(true); }}>アカウント削除</button>
                </div>
              </div>
            )}
          </div>

          <div className="page-wrap">
            <div className="grid-2">

              {/* Left */}
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

                {/* Balance card */}
                <div className="card" style={{
                  padding:32,
                  background: diff===0
                    ? "rgba(255,255,255,0.06)"
                    : diff>0
                      ? "linear-gradient(135deg,rgba(122,158,126,0.2),rgba(122,158,126,0.08))"
                      : "linear-gradient(135deg,rgba(196,168,130,0.3),rgba(196,168,130,0.1))",
                }}>
                  <p style={{ fontSize:11, color:"#9a9080", letterSpacing:2, marginBottom:12 }}>SETTLEMENT</p>
                  {diff===0 ? (
                    <p style={{ fontSize:28, fontWeight:800 }}>{unsettledEntries.length === 0 ? "記帳がありません" : "ぴったり ✨"}</p>
                  ) : diff>0 ? (
                    <>
                      <p style={{ fontSize:13, color:"#6b6358", marginBottom:6 }}>{partnerProfile?.nickname} さんが支払う金額</p>
                      <p style={{ fontSize:52, fontWeight:800, color:"#5d8a62", lineHeight:1 }}>¥{diff.toLocaleString()}</p>
                    </>
                  ) : (
                    <>
                      <p style={{ fontSize:13, color:"#6b6358", marginBottom:6 }}>あなた（{userProfile?.nickname}）が支払う金額</p>
                      <p style={{ fontSize:52, fontWeight:800, color:"#c94f4f", lineHeight:1 }}>¥{Math.abs(diff).toLocaleString()}</p>
                    </>
                  )}
                  <div style={{ display:"flex", gap:14, marginTop:24 }}>
                    <div style={{ flex:1, background:"rgba(122,158,126,0.08)", borderRadius:12, padding:"14px 18px" }}>
                      <p style={{ fontSize:11, color:"#9a9080", marginBottom:6 }}>{userProfile?.nickname}（自分）</p>
                      <p style={{ fontSize:22, fontWeight:700 }}>¥{myTotal.toLocaleString()}</p>
                    </div>
                    <div style={{ flex:1, background:"rgba(122,158,126,0.08)", borderRadius:12, padding:"14px 18px" }}>
                      <p style={{ fontSize:11, color:"#9a9080", marginBottom:6 }}>{partnerProfile?.nickname}（相手）</p>
                      <p style={{ fontSize:22, fontWeight:700 }}>¥{partnerTotal.toLocaleString()}</p>
                    </div>
                  </div>
                  <button
                    className="btn-settle"
                    style={{ marginTop:20 }}
                    onClick={() => setShowSettleConfirm(true)}
                    disabled={unsettledEntries.length === 0}
                  >
                    精算完了にする
                  </button>
                </div>

                {/* Add form */}
                <div className="card" style={{ padding:28 }}>
                  <p style={{ fontSize:15, fontWeight:700, marginBottom:20 }}>記帳する</p>
                  <div style={{ display:"flex", flexDirection:"column", gap:14 }}>
                    <div className="form-field">
                      <label>勘定科目</label>
                      <input type="text" placeholder="例：食費"
                        value={form.account} onChange={e => setForm({...form, account:e.target.value})} />
                    </div>
                    <div className="form-field">
                      <label>相手に請求する金額（円）</label>
                      <input type="number" placeholder="0" value={form.amount}
                        onChange={e => setForm({...form, amount:e.target.value})} />
                    </div>
                    <div className="form-field">
                      <label>メモ（任意）</label>
                      <input type="text" placeholder="例：スーパー" value={form.note}
                        onChange={e => setForm({...form, note:e.target.value})} />
                    </div>
                    <button className="btn-primary" style={{ marginTop:6 }} onClick={handleAdd} disabled={loading}>
                      {loading?"保存中...":"記帳する"}
                    </button>
                  </div>
                </div>
              </div>

              {/* Right */}
              <div style={{ display:"flex", flexDirection:"column", gap:20 }}>

                {/* Unsettled entries */}
                <div className="card" style={{ padding:"20px 24px" }}>
                  <p style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>未精算の記帳</p>
                  {unsettledEntries.length === 0 ? (
                    <p style={{ fontSize:13, color:"#b8b0a4", padding:"12px 0" }}>未精算の記帳はありません</p>
                  ) : unsettledEntries.slice(0, 10).map(e => (
                    <div key={e.id} className="entry-row">
                      <div style={{ display:"flex", alignItems:"center", gap:12, flex:1, minWidth:0 }}>
                        <div style={{
                          width:36, height:36, borderRadius:10, flexShrink:0,
                          display:"flex", alignItems:"center", justifyContent:"center",
                          fontSize:22,
                          background: e.userId===currentUser?.uid ? "rgba(122,158,126,0.15)" : "#f0ece6",
                          border: e.userId===currentUser?.uid ? "1.5px solid rgba(122,158,126,0.4)" : "1.5px solid #e8e2d9",
                        }}><img src={getAvatarSrc(e.avatar || (e.userId===currentUser?.uid ? userProfile?.avatar : partnerProfile?.avatar))} alt="avatar" style={{ width:22, height:22, objectFit:"contain" }} /></div>
                        <div style={{ minWidth:0 }}>
                          <p style={{ fontSize:14, fontWeight:600 }}>{e.account}</p>
                          <p style={{ fontSize:11, color:"#9a9080", marginTop:2 }}>
                            {e.note}{e.note?" · ":""}{e.createdAt?.toDate?.().toLocaleDateString("ja-JP")??""}
                          </p>
                        </div>
                      </div>
                      <div style={{ display:"flex", alignItems:"center", gap:8, flexShrink:0 }}>
                        <span style={{ fontSize:16, fontWeight:700 }}>¥{e.amount.toLocaleString()}</span>
                        {e.userId === currentUser?.uid && (
                          <>
                            <button onClick={() => setEditEntry({ id:e.id, account:e.account, amount:e.amount, note:e.note||"" })} style={{
                              background:"rgba(122,158,126,0.1)", border:"1px solid rgba(122,158,126,0.3)",
                              color:"#5d8a62", borderRadius:8, padding:"4px 10px",
                              fontSize:12, fontWeight:600, cursor:"pointer",
                            }}>修正</button>
                            <button onClick={() => setDeleteEntryId(e.id)} style={{
                              background:"rgba(201,79,79,0.08)", border:"1px solid rgba(201,79,79,0.25)",
                              color:"#c94f4f", borderRadius:8, padding:"4px 10px",
                              fontSize:12, fontWeight:600, cursor:"pointer",
                            }}>削除</button>
                          </>
                        )}
                      </div>
                    </div>
                  ))}
                </div>

                {/* Settled entries */}
                {settledEntries.length > 0 && (
                  <div className="card" style={{ padding:"20px 24px" }}>
                    <p style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>
                      精算済みの記帳
                      <span style={{ fontSize:11, color:"#aaa098", marginLeft:8, fontWeight:400 }}>
                        （6ヶ月後に自動削除）
                      </span>
                    </p>
                    {settledEntries.slice(0, 6).map(e => (
                      <div key={e.id} className="entry-row" style={{ opacity:0.55 }}>
                        <div style={{ display:"flex", alignItems:"center", gap:12 }}>
                          <div style={{
                            width:36, height:36, borderRadius:10, flexShrink:0,
                            display:"flex", alignItems:"center", justifyContent:"center",
                            fontSize:20, background:"#f0ece6",
                          }}><img src={getAvatarSrc(e.userId===currentUser?.uid ? userProfile?.avatar : partnerProfile?.avatar)} alt="avatar" style={{ width:22, height:22, objectFit:"contain" }} /></div>
                          <div>
                            <p style={{ fontSize:14, fontWeight:600 }}>{e.account} <span className="settled-badge">精算済</span></p>
                            <p style={{ fontSize:11, color:"#9a9080", marginTop:2 }}>
                              {e.note}{e.note?" · ":""}{e.createdAt?.toDate?.().toLocaleDateString("ja-JP")??""}
                            </p>
                          </div>
                        </div>
                        <span style={{ fontSize:16, fontWeight:700 }}>¥{e.amount.toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                )}

                {/* Summary */}
                <div className="card" style={{ padding:"20px 24px" }}>
                  <p style={{ fontSize:15, fontWeight:700, marginBottom:12 }}>科目別集計（未精算）</p>
                  {[...new Set(unsettledEntries.map(e => e.account))].map(acc => {
                    const total = unsettledEntries.filter(e => e.account===acc).reduce((s,e) => s+e.amount, 0);
                    return (
                      <div key={acc} className="entry-row">
                        <span style={{ fontSize:14, fontWeight:600 }}>{acc}</span>
                        <span style={{ fontSize:15, fontWeight:700 }}>¥{total.toLocaleString()}</span>
                      </div>
                    );
                  })}
                  {unsettledEntries.length > 0 ? (
                    <div style={{
                      display:"flex", justifyContent:"space-between", alignItems:"center",
                      paddingTop:14, marginTop:8, borderTop:"1px solid #e8e2d9",
                    }}>
                      <span style={{ fontWeight:700, fontSize:15 }}>合計</span>
                      <span style={{ fontWeight:800, fontSize:20, color:"#5d8a62" }}>
                        ¥{unsettledEntries.reduce((s,e) => s+e.amount, 0).toLocaleString()}
                      </span>
                    </div>
                  ) : (
                    <p style={{ fontSize:13, color:"#b8b0a4", padding:"4px 0 8px" }}>データがありません</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== フッター ===== */}
      {page === "home" && (
        <div style={{
          borderTop:"1px solid #e8e2d9",
          background:"rgba(245,242,238,0.9)", backdropFilter:"blur(12px)",
        }}>
          {/* 広告エリア */}
          <div style={{
            padding:"12px 40px",
            borderBottom:"1px solid #e8e2d9",
            display:"flex", justifyContent:"center",
            background:"#fff",
          }}>
            <script src="https://adm.shinobi.jp/s/ecdf553ddecaf27a37302364980b0a7a" async></script>
          </div>
          {/* PWA案内 + お問い合わせ */}
          <div style={{
            padding:"12px 40px", display:"flex", alignItems:"center",
            justifyContent:"space-between", flexWrap:"wrap", gap:10,
          }}>
            <div style={{ display:"flex", alignItems:"center", gap:8 }}>
              
              <p style={{ fontSize:12, color:"#9a9080" }}>
                iPhoneでアプリとして使う：Safariで開き
                <span style={{ color:"#5d8a62", fontWeight:600 }}> 共有ボタン</span> →
                <span style={{ color:"#5d8a62", fontWeight:600 }}>「ホーム画面に追加」</span>
              </p>
            </div>
            <a href='https://forms.gle/jsdKFSGNTmLPfNyj6' target="_blank" rel="noreferrer" style={{
              fontSize:12, color:"#8a8070", textDecoration:"none",
              borderBottom:"1px solid #ddd8cf", paddingBottom:1, flexShrink:0,
            }}>お問い合わせ</a>
          </div>
        </div>
      )}
    </>
  );
}