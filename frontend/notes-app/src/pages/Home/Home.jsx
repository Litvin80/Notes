import { MdAdd } from "react-icons/md";
import NoteCard from "../../components/Cards/NoteCard";
import Navbar from "../../components/Navbar/Navbar";
import AddEditNotes from "./AddEditNotes";
import { useEffect, useState } from "react";
import Modal from "react-modal";
import { useNavigate } from "react-router-dom";
import axiosInstance from "../../utils/axiosInstance";
import Toast from "../../components/ToastMessage/Toast";
import EmptyCard from "../../components/EmptyCard/EmptyCard";
import AddNotesImg from "../../assets/images/add-notes.svg";
import NoDataImg from "../../assets/images/no-data.svg";

function Home() {
  const [openAddEditModal, setOpenAddEditModal] = useState({
      isShown: false,
      type: "add",
      data: null,
  });

  const [showToastMsg, setShowToastMsg] = useState({
    isShown: false,
    message: "",
    type: "add",
  });

  const [allNotes, setAllNotes] = useState([]);
  const [userInfo, setUserInfo] = useState(null);
  const [isSearch, setIsSearch] = useState(false);

  const navigate = useNavigate();

  const handleEdit = (noteDetails) => {
    setOpenAddEditModal({ 
      isShown: true, 
      data: noteDetails,
      type: "edit" 
    });
  };

  const showToastMessage = (message, type) => {
    setShowToastMsg({
      isShown: true,
      message,
      type
    });
  };

  const handleCloseToast = () => {
    setShowToastMsg({
      isShown: false,
      message: "",
    });
  };

  const getUserInfo = async () => {
    try {
      const response = await axiosInstance.get("/get-user");
      if (response.data && response.data.user) {
        setUserInfo(response.data.user);
      };
    } catch (error) {
      if (error.response.status === 401) {
        localStorage.clear();
        navigate("/login");
      };
    };
  };

  const getAllNotes = async () => { 
    try { 
      const response = await axiosInstance.get("/get-all-notes");
      if (response.data && response.data.notes) { 
        setAllNotes(response.data.notes); 
      } 
    } catch {
      console.log("Сталася непередбачена помилка. Будь ласка, спробуйте ще раз.");
    };
  };

  const deleteNote = async(data) => {
    const noteId = data._id;
    try {
      const response = await axiosInstance.delete("/delete-note/" + noteId);

      if (response.data && !response.data.error) {
        showToastMessage("Нотатку видалено успішно", 'delete');
        getAllNotes();
      }
    } catch (error) {
      if (error.response && error.response.data && error.response.data.message) {
        console.log("Сталася непередбачена помилка. Будь ласка, спробуйте ще раз.");
      };
    }
  };

  const onSearchNote = async (query) => {
    try {
      const response = await axiosInstance.get("/search-notes", {
        params: {query},
      });

      if (response.data && response.data.notes) {
        setIsSearch(true);
        setAllNotes(response.data.notes);
      }
    } catch(error) {
      console.log(error);
    }
  };

  const updateIsPinned = async (noteData) => {
    const noteId = noteData._id;
    try {
      const response = await axiosInstance.put("/update-note-pinned/" + noteId, {
        isPinned: !noteData.isPinned
      });

      if (response.data && response.data.note) {
        showToastMessage("Нотатку успішно оновлено");
        getAllNotes();
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleClearSearch = () => {
    setIsSearch(false);
    getAllNotes();
  };

  useEffect(() => {
    getAllNotes();
    getUserInfo();
    return () => {};
  }, []);

  return (
    <>
      <Navbar userInfo={userInfo} onSearchNote={onSearchNote} handleClearSearch={handleClearSearch} />
      <div className="container mx-auto px-3">
        {allNotes.length > 0 ? (<div className="grid grid-cols-3 gap-4 mt-8">
          {allNotes.map((item, index) => (
            <NoteCard
              key={item._id} 
              title={item.title}
              date={item.createdOn} 
              content={item.content} 
              tags={item.tags}
              isPinned={item.isPinned}
              onEdit={() => handleEdit(item)}
              onDelete={() => deleteNote(item)}
              onPinNote={() => updateIsPinned(item)}
            />
          ))}
        </div> ): (
          <EmptyCard imgSrc={isSearch ? NoDataImg : AddNotesImg} message={isSearch ? 'Ой! Нотаток, що відповідають вашому пошуку, не знайдено.' : `Почніть створювати свою першу нотатку! Натисніть кнопку "Додати", щоб записати свої думки, ідеї та нагадування. Давайте почнемо!`} />
      )}
      </div>
      <button 
        className="w-16 h-16 flex items-center justify-center rounded-2xl bg-primary hover:bg-blue-600 absolute right-10 bottom-10" 
        onClick={() => {
          setOpenAddEditModal({
            isShown: true,
            type: "add",
            data: null
          });
        }}
      >
        <MdAdd
          className="text-[32px] text-white"
        />
      </button>
      <Modal
        isOpen={openAddEditModal.isShown}
        onRequestClose={() => {}}
        style={{
          overlay: {
              backgroundColor: "rgba(0,0,0,0.3)",
          },
        }}
        contentLabel=""
        className="w-[40%] max-h-3/4 bg-white rounded-md mx-auto mt-14 p-5"
      >
          <AddEditNotes
            type={openAddEditModal.type}
            noteData={openAddEditModal.data}
            onClose={() => {
              setOpenAddEditModal({
                isShonw: false,
                type: "add",
                data: null
              });
            }}
            getAllNotes={getAllNotes}
            showToastMessage={showToastMessage}
          />
      </Modal>
      <Toast
        isShown={showToastMsg.isShown}
        message={showToastMsg.message}
        type={showToastMsg.type}
        onClose={handleCloseToast}
      />
    </>
  );
};

export default Home;