const typingForm = document.querySelector(".typing-form");
const chatList = document.querySelector(".chat-list");
const suggestions = document.querySelectorAll(".suggestion-list .suggestion");
const toggleThemeButton = document.querySelector("#toggle-theme-button");
const deleteChatButton = document.querySelector("#delete-chat-button");

let userMessage = null;
let isResponseGenerating = false;
//API configuration
const API_KEY = "AIzaSyAxyMFx1xtDOXxxm4ZCZgS2dQ95yn_YmvA";
const API_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${API_KEY}`;

const loadLocalStorageData = () => {
  const savedChats = localStorage.getItem("savedChats");
  const isLightMode = localStorage.getItem("themeColor") === "light_mode";

  //Apply The Stored Theme
  document.body.classList.toggle("light_mode", isLightMode);
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";

  //Restored Saved Chats
  chatList.innerHTML = savedChats || "";
  document.body.classList.toggle("hide-header", savedChats);
  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the button
};

loadLocalStorageData();

//Crete a new message element and return it
const createMessageElement = (content, ...className) => {
  const div = document.createElement("div");
  div.classList.add("message", ...chatList.className);
  div.innerHTML = content;
  return div;
};
//show typing effect by displaying words one by one
const showTypingEffect = (text, textElement, incomingMessageDiv) => {
  const words = text.split(" ");
  let currentWordIndex = 0;

  const typingInterval = setInterval(() => {
    textElement.innerText +=
      (currentWordIndex === 0 ? "" : " ") + words[currentWordIndex++];
    incomingMessageDiv.querySelector(".icon").classList.add("hide");
    //if all words are displayed
    if (currentWordIndex === words.length) {
      clearInterval(typingInterval);
      isResponseGenerating = false;
      incomingMessageDiv.querySelector(".icon").classList.remove("hide");
      localStorage.setItem("savedChats", chatList.innerHTML); //Save chats to local storage
    }
    chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the button
  }, 75);
};
//Fetch response from the API based on user message
const generateAPIResponse = async (incomingMessageDiv) => {
  const textElement = incomingMessageDiv.querySelector(".text"); //Get text Element
  //Send a POST request to the API with The user,s message
  try {
    const response = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            role: "user",
            parts: [{ text: userMessage }],
          },
        ],
      }),
    });
    const data = await response.json();
    if (!response.ok) throw Error(data.error.message);
    //Get the API response text and remove frm it
    const apiResponse = data?.candidates[0].content.parts[0].text.replace(
      /\*\*(.*?)\*\*/g,
      "$1"
    );
    showTypingEffect(apiResponse, textElement, incomingMessageDiv);
  } catch (error) {
    isResponseGenerating = false;
    textElement.innerText = error.message;
    textElement.classList.add("error");
  } finally {
    incomingMessageDiv.classList.remove("loading");
  }
};

//Show a loading animation while waiting for the API response

const showLoadingAnimation = () => {
  const html = `<div class="message-content">
            <img src="Assets/images/gemini.svg" alt="Gemini Image" class="avatar">
            <p class="text"></p>
            <div class="loading-indicator">
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            <div class="loading-bar"></div>
            </div>
        </div>
        <span onclick="copyMessage(this)" class=" icon material-symbols-rounded">content_copy</span>`;

  const incomingMessageDiv = createMessageElement(html, "incoming", "loading");
  chatList.appendChild(incomingMessageDiv);

  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the button

  generateAPIResponse(incomingMessageDiv);
};
//copy message text to the clipboard
const copyMessage = (copyIcon) => {
  const messageText = copyIcon.parentElement.querySelector(".text").innerText;

  navigator.clipboard.writeText(messageText);
  copyIcon.innerText = "done";
  setTimeout(() => (copyIcon.innerText = "content_copy"), 1000); //Revert icon after 1 second
};
//handle sending outgoing chat message
const handleOutgoingChat = () => {
  userMessage =
    typingForm.querySelector(".typing-input").value.trim() || userMessage;
  if (!userMessage || isResponseGenerating) return; //Exit if there is no message

  isResponseGenerating = true;

  const html = ` <div class="message-content">
            <img src="Assets/images/user.jpg" alt="User Image" class="avatar">
            <p class="text"></p>
        </div>`;

  const outgoingMessageDiv = createMessageElement(html, "outgoing");
  outgoingMessageDiv.querySelector(".text").innerHTML = userMessage;
  chatList.appendChild(outgoingMessageDiv);

  typingForm.reset(); //
  chatList.scrollTo(0, chatList.scrollHeight); //Scroll to the button
  document.body.classList.add("hide-header"); //hide the header once chat start
  setTimeout(showLoadingAnimation, 500);
};
//Set userMessage and handle outgoing chat when a suggestion is clicked
suggestions.forEach((suggestion) => {
  suggestion.addEventListener("click", () => {
    userMessage = suggestion.querySelector(".text").innerText;
    handleOutgoingChat();
  });
});

//Toggle between light and dark themes
toggleThemeButton.addEventListener("click", () => {
  const isLightMode = document.body.classList.toggle("light_mode");
  localStorage.setItem("themeColor", isLightMode ? "dark_mode" : "light_mode");
  toggleThemeButton.innerText = isLightMode ? "dark_mode" : "light_mode";
});
//delete all chats from local storage when button is clicked
deleteChatButton.addEventListener("click", () => {
  if (confirm("Are you sure you want to delete all message?")) {
    localStorage.removeItem("savedChats");
    loadLocalStorageData();
  }
});

//Prevent default form submission and handle outgoing chat
typingForm.addEventListener("submit", (e) => {
  e.preventDefault();

  handleOutgoingChat();
});
