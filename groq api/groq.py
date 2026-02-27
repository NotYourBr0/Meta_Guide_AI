import os
import time
from openai import OpenAI

# Color Constants for a premium terminal feel
GREEN = "\033[92m"
CYAN = "\033[96m"
BOLD = "\033[1m"
RESET = "\033[0m"


def typing_effect(text, delay=0.01):
    """Simulates a human-like typing effect for the output."""
    for char in text:
        print(char, end="", flush=True)
        time.sleep(delay)
    print()


def main():
    # 1. Setup Configuration
    # We use the provided key directly but prioritize environment variables for security
    API_KEY = os.environ.get("GROQ_API_KEY")
    if not API_KEY:
        raise ValueError("GROQ_API_KEY environment variable is not set.")
    BASE_URL = "https://api.groq.com/openai/v1"

    # 2. Initialize the Client
    client = OpenAI(
        api_key=API_KEY,
        base_url=BASE_URL,
    )

    print(f"{BOLD}{CYAN}🚀 Groq Engine Inferencing...{RESET}")
    print(f"{CYAN}─" * 40 + RESET)

    try:
        # 3. Prompt Setup
        prompt = "Tell me all about the Digital Image Processing"
        print(f"{BOLD}User:{RESET} {prompt}")
        print(f"{BOLD}AI is thinking...{RESET}", end="\r")

        # 4. Generate Completion
        # We use llama-3.3-70b-versatile for superior performance
        response = client.chat.completions.create(
            messages=[
                {
                    "role": "user",
                    "content": prompt,
                }
            ],
            model="llama-3.3-70b-versatile",
            temperature=0.7,
            max_tokens=1024,
        )

        content = response.choices[0].message.content

        # 5. Premium Output Layout
        print(f"{BOLD}{GREEN}✔ Success! Response Generated.{RESET}    ")
        print(f"\n{CYAN}┌{'─' * 50}┐{RESET}")
        print(f"{CYAN}│{BOLD} GROQ RESPONSE {' ' * 35} │{RESET}")
        print(f"{CYAN}├{'─' * 50}┤{RESET}")

        # Indent and type the content
        print(f"{CYAN}│{RESET} ", end="")
        wrapped_content = content.replace("\n", f"\n{CYAN}│{RESET} ")
        typing_effect(wrapped_content)

        print(f"{CYAN}└{'─' * 50}┘{RESET}")
        print(f"\n{BOLD}{CYAN}Stats:{RESET} Tokens: {response.usage.total_tokens}")

    except Exception as e:
        print(f"\n{BOLD}\033[91m✖ Error Encountered:{RESET} {e}")
        print(
            f"{CYAN}Tip:{RESET} Ensure your API Key is valid and you have an active internet connection."
        )


if __name__ == "__main__":
    main()
