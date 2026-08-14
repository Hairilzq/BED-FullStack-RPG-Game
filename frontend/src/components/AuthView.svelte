<script>
  export let onLoginSuccess; // Passed down from App.svelte

  let isLoginMode = true; // Toggle between Login and Signup
  let username = "";
  let password = "";
  let errorMessage = "";
  let isLoading = false;

  function toggleMode() {
    isLoginMode = !isLoginMode;
    errorMessage = ""; // Clear errors when switching modes
  }

  async function handleSubmit(event) {
    event.preventDefault(); // Prevent page reload
    isLoading = true;
    errorMessage = "";

    try {
      // 1. If in Signup Mode, hit the signup endpoint first
      if (!isLoginMode) {
        const signupResponse = await fetch(
          `http://localhost:3000/login/signup`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ username, password }),
            credentials: "include",
          },
        );

        const signupData = await signupResponse.json();

        if (!signupResponse.ok) {
          const rawMessage = signupData.message || signupData.error || "";

          if (
            rawMessage.toLowerCase().includes("taken") ||
            rawMessage.toLowerCase().includes("exists") ||
            signupResponse.status === 409
          ) {
            throw new Error("Username already taken");
          } else if (signupResponse.status >= 500) {
            throw new Error("Internal Server Error");
          } else {
            throw new Error("Signup Failed");
          }
        }
      }

      // 2. Log the user in (runs for both pure logins AND automatically after signups)
      const loginResponse = await fetch(`http://localhost:3000/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
        credentials: "include", // CRITICAL: This allows the browser to accept and store the HTTP-only cookie
      });

      const loginData = await loginResponse.json();

      if (!loginResponse.ok) {
        const rawMessage = loginData.message || loginData.error || "";

        if (
          rawMessage.toLowerCase().includes("credential") ||
          loginResponse.status === 401
        ) {
          throw new Error("Invalid credentials");
        } else if (loginResponse.status >= 500) {
          throw new Error("Internal Server Error");
        } else {
          throw new Error("Authentication Failed");
        }
      }

      // 3. If successful, tell App.svelte to change the view to 'menu'
      onLoginSuccess(username);
    } catch (err) {
      errorMessage = err.message;
    } finally {
      isLoading = false;
    }
  }
</script>

<div class="auth-wrapper">
  <div class="auth-card">
    <h1>{isLoginMode ? "Login" : "Create Account"}</h1>

    <form on:submit={handleSubmit}>
      <div class="input-group">
        <label for="username">Username</label>
        <input type="text" id="username" bind:value={username} required />
      </div>

      <div class="input-group">
        <label for="password">Password</label>
        <input type="password" id="password" bind:value={password} required />
      </div>

      {#if errorMessage}
        <div class="error-banner">{errorMessage}</div>
      {/if}

      <button type="submit" disabled={isLoading}>
        {isLoading ? "Processing..." : isLoginMode ? "Enter Game" : "Sign Up"}
      </button>
    </form>

    <div class="toggle-text">
      {isLoginMode ? "Don't have an account?" : "Already have an account?"}
      <!-- svelte-ignore a11y-invalid-attribute -->
      <a href="#" on:click|preventDefault={toggleMode}>
        {isLoginMode ? "Sign up here" : "Login here"}
      </a>
    </div>
  </div>
</div>

<style>
  .auth-wrapper {
    display: flex;
    justify-content: center;
    align-items: center;
    flex: 1; /* Pushes card to middle of screen */
  }

  .auth-card {
    background-color: #2b2b36;
    padding: 40px;
    border-radius: 12px;
    box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    width: 100%;
    max-width: 400px;
  }

  h1 {
    margin-top: 0;
    text-align: center;
    color: #4da8da; /* A nice game-like blue */
  }

  .input-group {
    display: flex;
    flex-direction: column;
    margin-bottom: 20px;
  }

  label {
    margin-bottom: 8px;
    font-size: 14px;
    color: #a0a0b0;
  }

  input {
    padding: 12px;
    border-radius: 6px;
    border: 1px solid #444;
    background-color: #1e1e24;
    color: white;
    font-size: 16px;
  }

  input:focus {
    outline: none;
    border-color: #4da8da;
  }

  button {
    width: 100%;
    padding: 14px;
    background-color: #4da8da;
    color: white;
    border: none;
    border-radius: 6px;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: background-color 0.2s;
  }

  button:hover:not(:disabled) {
    background-color: #3b8bc2;
  }

  button:disabled {
    background-color: #555;
    cursor: not-allowed;
  }

  .error-banner {
    background-color: #ff4c4c22;
    border: 1px solid #ff4c4c;
    color: #ff8888;
    padding: 10px;
    border-radius: 6px;
    margin-bottom: 20px;
    text-align: center;
    font-size: 14px;
  }

  .toggle-text {
    margin-top: 24px;
    text-align: center;
    font-size: 14px;
    color: #a0a0b0;
  }

  a {
    color: #4da8da;
    text-decoration: none;
    margin-left: 5px;
  }

  a:hover {
    text-decoration: underline;
  }
</style>
