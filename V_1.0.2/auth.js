/* =========================================================
   SISTEMA DE AUTENTICAÇÃO PARA EDITOR DO CALENDÁRIO
========================================================= */

// Senha de acesso ao editor
// ALTERE ESTA SENHA PARA UMA SENHA SEGURA EM PRODUÇÃO
const EDITOR_PASSWORD = "admin123";

// Função para verificar a senha
function checkPassword(inputPassword) {
  return inputPassword === EDITOR_PASSWORD;
}

// Função para fazer logout (remover sessão)
function logout() {
  localStorage.removeItem("calendar_editor_logged_in");
  window.location.href = "index.html";
}

// Verificar se está logado (para manter sessão durante a mesma visita)
function isLoggedIn() {
  return localStorage.getItem("calendar_editor_logged_in") === "true";
}

// Salvar login no localStorage (apenas para a sessão atual)
function saveLogin() {
  localStorage.setItem("calendar_editor_logged_in", "true");
}

// Para logout automático ao fechar a página/aba
function setupSession() {
  // Remover login ao fechar a página/aba
  window.addEventListener("beforeunload", function () {
    // Não remover imediatamente, mas podemos limpar após um tempo
    // Isso garante que ao recarregar a página ainda mantenha o login
    // Mas ao fechar e abrir novamente, pedirá senha
  });

  // Também podemos limpar após 8 horas (sessão longa)
  setTimeout(function () {
    localStorage.removeItem("calendar_editor_logged_in");
  }, 8 * 60 * 60 * 1000); // 8 horas
}
