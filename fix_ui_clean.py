import re

def clean_file(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # 1. Remove the "o con tu correo" divider
    content = re.sub(r'<div className="relative flex items-center justify-center">.*?o con tu correo.*?</div>', '', content, flags=re.DOTALL)
    
    # 2. Remove the form
    content = re.sub(r'<form onSubmit=\{handleSubmit\}.*?</form>', '', content, flags=re.DOTALL)
    
    with open(filepath, 'w') as f:
        f.write(content)

clean_file('src/components/auth/LoginScreen.tsx')
clean_file('src/components/auth/AuthModal.tsx')

print("Success")
