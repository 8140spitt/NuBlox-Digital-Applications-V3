# Terminal Logging Scripts

These scripts capture full terminal interactions and convert them into reviewable transcripts.

## Scripts

- `start-session.sh`: starts a recorded interactive shell session.
- `list-sessions.sh`: lists recorded terminal sessions under `logs/terminal/`.
- `review-session.sh`: converts a `.typescript` recording into a readable `.review.txt` file and previews it.
- `enable-auto-start-zsh.sh`: enables automatic logging for new zsh terminals opened in this repository path.
- `disable-auto-start-zsh.sh`: removes the zsh auto-start hook.
- `auto-start-hook.sh`: shell hook sourced by zsh startup.

## Typical flow

```bash
./scripts/terminal-logging/enable-auto-start-zsh.sh
# open a new terminal in this repo; recording starts automatically

./scripts/terminal-logging/start-session.sh
# ... run commands in recorded shell ...
exit

./scripts/terminal-logging/list-sessions.sh
./scripts/terminal-logging/review-session.sh latest
```

## Notes

- On macOS, `start-session.sh` uses BSD `script`; on Linux, it uses util-linux `script`.
- Session metadata is stored alongside each recording as a `.meta.txt` file.
- Generated logs are ignored by git via `.gitignore`.
- Auto-start is limited to interactive terminals whose working directory is inside this repository.
