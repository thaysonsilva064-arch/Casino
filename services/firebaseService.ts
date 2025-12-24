
import { initializeApp } from "firebase/app";
import { getAuth, signInWithPopup, GoogleAuthProvider, onAuthStateChanged, signOut } from "firebase/auth";
import { getFirestore, doc, setDoc, getDoc, collection, onSnapshot, updateDoc, increment } from "firebase/firestore";
import { User, Room, GameType, RoomStatus } from '../types';

// Configurações fornecidas diretamente pelo usuário
const firebaseConfig = {
  apiKey: "AIzaSyDJxquLoSAb1apcUcEhocj6LK4sCVcgWIw",
  authDomain: "nexus-casino.firebaseapp.com",
  projectId: "nexus-casino",
  storageBucket: "nexus-casino.firebasestorage.app",
  messagingSenderId: "562033931456",
  appId: "1:562033931456:web:819c1bf02c8b1a72092925"
};

// Inicialização segura com fallback
let app, auth, db_firestore, provider;

try {
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db_firestore = getFirestore(app);
  provider = new GoogleAuthProvider();
} catch (error) {
  console.error("Firebase init failed:", error);
}

type SubscriptionCallback = (rooms: Room[]) => void;

class FirebaseService {
  private currentUser: User | null = null;

  initAuth(onUserChanged: (user: User | null) => void) {
    if (!auth) {
        console.error("Auth não inicializado!");
        return;
    }
    onAuthStateChanged(auth, async (gUser) => {
      if (gUser) {
        try {
          const userDoc = doc(db_firestore, "users", gUser.uid);
          const snap = await getDoc(userDoc);
          if (snap.exists()) {
            this.currentUser = snap.data() as User;
          } else {
            this.currentUser = {
              id: gUser.uid,
              name: gUser.displayName || "Jogador",
              photoURL: gUser.photoURL || `https://api.dicebear.com/7.x/avataaars/svg?seed=${gUser.uid}`,
              status: 'online',
              level: 1,
              coins: 5000 // Bônus inicial maior para novos jogadores
            };
            await setDoc(userDoc, this.currentUser);
          }
          onUserChanged(this.currentUser);
        } catch (err) {
          console.error("Erro ao buscar dados do usuário:", err);
          onUserChanged(null);
        }
      } else {
        this.currentUser = null;
        onUserChanged(null);
      }
    });
  }

  async loginWithGoogle(): Promise<User | null> {
    if (!auth || !provider) return null;
    try {
      const result = await signInWithPopup(auth, provider);
      const gUser = result.user;
      
      const userDoc = doc(db_firestore, "users", gUser.uid);
      const snap = await getDoc(userDoc);
      
      if (!snap.exists()) {
        this.currentUser = {
          id: gUser.uid,
          name: gUser.displayName || "Jogador",
          photoURL: gUser.photoURL || "",
          status: 'online',
          level: 1,
          coins: 5000
        };
        await setDoc(userDoc, this.currentUser);
      } else {
        this.currentUser = snap.data() as User;
        await updateDoc(userDoc, { status: 'online' });
      }
      return this.currentUser;
    } catch (error) {
      console.error("Login failed:", error);
      throw error;
    }
  }

  async logout() {
    if (this.currentUser && auth) {
      try {
        await updateDoc(doc(db_firestore, "users", this.currentUser.id), { status: 'offline' });
        await signOut(auth);
      } catch (e) {
        console.error("Logout error:", e);
      }
    }
  }

  getCurrentUser() { return this.currentUser; }

  async updateProfile(name: string, photoURL: string) {
    if (this.currentUser) {
      const userDoc = doc(db_firestore, "users", this.currentUser.id);
      await updateDoc(userDoc, { name, photoURL });
      this.currentUser.name = name;
      this.currentUser.photoURL = photoURL;
    }
  }

  async updateCoins(amount: number) {
    if (this.currentUser) {
      const userDoc = doc(db_firestore, "users", this.currentUser.id);
      await updateDoc(userDoc, { coins: increment(amount) });
      this.currentUser.coins += amount;
    }
  }

  onRoomsUpdate(callback: SubscriptionCallback) {
    if (!db_firestore) return () => {};
    const q = collection(db_firestore, "rooms");
    return onSnapshot(q, (snapshot) => {
      const rooms = snapshot.docs.map(doc => ({ ...doc.data(), id: doc.id } as Room));
      callback(rooms);
    }, (error) => {
      console.error("Snapshot error:", error);
    });
  }

  async createRoom(gameType: GameType, maxPlayers: number, bet: number = 0): Promise<Room> {
    if (!this.currentUser) throw new Error("Logue primeiro!");
    
    const roomId = `ROOM_${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    const roomData: any = {
      creator: this.currentUser,
      gameType,
      players: [this.currentUser],
      spectators: [],
      maxPlayers,
      status: RoomStatus.WAITING,
      bet,
      pot: bet
    };

    await setDoc(doc(db_firestore, "rooms", roomId), roomData);
    return { ...roomData, id: roomId };
  }

  async joinRoom(roomId: string, asSpectator: boolean = false): Promise<Room | null> {
    if (!this.currentUser) return null;
    const roomRef = doc(db_firestore, "rooms", roomId);
    const snap = await getDoc(roomRef);
    if (!snap.exists()) return null;

    const room = snap.data() as Room;

    if (asSpectator) {
      const spectators = [...(room.spectators || []), this.currentUser];
      await updateDoc(roomRef, { spectators });
    } else {
      if (room.players.length < room.maxPlayers) {
        const players = [...room.players, this.currentUser];
        const status = players.length === room.maxPlayers ? RoomStatus.PLAYING : RoomStatus.WAITING;
        await updateDoc(roomRef, { players, status, pot: increment(room.bet) });
      }
    }
    return { ...room, id: roomId };
  }

  async leaveRoom(roomId: string) {
    if (!this.currentUser) return;
    const roomRef = doc(db_firestore, "rooms", roomId);
    const snap = await getDoc(roomRef);
    if (snap.exists()) {
      const room = snap.data() as Room;
      const players = room.players.filter(p => p.id !== this.currentUser?.id);
      if (players.length > 0) {
        await updateDoc(roomRef, { players, status: RoomStatus.WAITING });
      }
    }
  }
}

export const db = new FirebaseService();
