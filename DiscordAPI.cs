using System.Linq;
using Newtonsoft.Json;
using Facepunch;

namespace Oxide.Plugins
{
    [Info("DiscordAPI", "Blagov Egor", "1.0.0")]
    [Description("Discord Client for Rust OxideMods")]
    class DiscordAPI : RustPlugin
    {
        const string permRead = "discordapi.read";
        const string permDisable = "discordapi.disable";
        const string DiscordMagicPrefix = "discord.send";
        private PluginConfig config;
        private bool loaded = false;
        private Role adminRole = null;
        class Role {
            public string color;
            public string name;
            public string id;
            public string PreprocessMention(string input) => input.Replace($"@{name}", $"<@&{id}>");

            public string ToChat() => $"<color={color}>[{name}]</color>";
            public string ToConsole() => $"[{name}]";
        }

        class Message {
            public string username;
            public string content;
            public Role[] roles = new Role[0];

            public string ToChatMessage() => $"{FormatRolesChat()}<size=15><color=#e25604>{username}</color>: {content}</size>";
            public string ToConsoleMessage() =>$"{FormatRolesConsole()}{username}: {content}";

            private string FormatRolesChat() {
                if (roles.Length == 0) {
                    return "";
                }

                return string.Join(" ", roles.Select(x => x.ToChat())) + " ";
            }

            private string FormatRolesConsole() {
                if (roles.Length == 0) {
                    return "";
                }

                return string.Join(" ", roles.Select(x => x.ToConsole())) + " ";
            }
        }

        class ReadyEvent {
            public string server;
            public string channel;
            public Role adminRole;
        }

        void Loaded() {
        }

        private T parseArg<T>(ConsoleSystem.Arg arg) {
            return JsonConvert.DeserializeObject<T>(arg.Args[0]);
        }

        [ConsoleCommand("discordapi.ready")]
        private void EventDiscordReady(ConsoleSystem.Arg arg) {
            ReadyEvent readyEvent = parseArg<ReadyEvent>(arg);
            NextTick(()=>Puts($"Connected to server: {readyEvent.server}, channel: {readyEvent.channel}"));
            adminRole = readyEvent.adminRole;
            sendToDiscord(_(config.WelcomeMessage));
        }

        private void sendToDiscord(string message) {
            NextTick(()=>Puts($"{DiscordMagicPrefix}{message}"));
        }

        [ConsoleCommand("discordapi.message")]
        private void EventDiscordMessage(ConsoleSystem.Arg arg) {
            Message message = parseArg<Message>(arg);
            string messageToChat = message.ToChatMessage();
            foreach (var pl in BasePlayer.activePlayerList) {
                if (!permission.UserHasPermission(pl.UserIDString, permRead) || permission.UserHasPermission(pl.UserIDString, permDisable)) {
                    continue;
                }

                pl.SendConsoleCommand("chat.add", new object[] { config.ChatIconId, messageToChat });
            }
            NextTick(()=>Puts($"S<-D: {message.ToConsoleMessage()}"));
        }

        private void Init() {
            permission.RegisterPermission(permRead, this);
            permission.RegisterPermission(permDisable, this);
            config = Config.ReadObject<PluginConfig>();
            Config.WriteObject(config);
        }

        private void OnServerInitialized() {
            loaded = true;
            NextTick(() => {
                sendToDiscord(_(config.StartMessage));
            });
        }

        private void Unload() {
            NextTick(() => {
                sendToDiscord(_(config.GoodbyeMessage));
            });
        }

        private string _(string input) {
            return input
                .Replace("{ServerName}", config.ServerName)
                .Replace("{Loading}", loaded ? "" : config.LoadingMessage);
        }

        private void OnPlayerInit(BasePlayer player) {
            this.SendMessage($":ballot_box_with_check: **{player.displayName}** присоединился к игре");
        }

        private void OnPlayerDisconnected(BasePlayer player, string reason) {
            this.SendMessage($":x: **{player.displayName}** вышел с сервера, причина: **{reason}**");
        }

        #region API
        void SendMessage(string MessageText) {
            if (adminRole != null) {
                MessageText = adminRole.PreprocessMention(MessageText);
            }
            sendToDiscord(MessageText);
        }

        void SetInputEnabled(ulong playerId, bool enabled) {
            if (enabled) {
                permission.RevokeUserPermission(playerId.ToString(), permDisable);
            } else {
                permission.GrantUserPermission(playerId.ToString(), permDisable, this);
            }
        }
        #endregion

        protected override void LoadDefaultConfig() {
            Config.WriteObject(new PluginConfig(), true);
        }

        private class PluginConfig {
            public ulong ChatIconId = 76561198883317679;
            public string WelcomeMessage = ":bulb: **{ServerName}** подключен к **Discord** {Loading}";
            public string GoodbyeMessage = ":mobile_phone_off: **{ServerName}** отключен от **Discord**";
            public string ServerName = "Fight Rust Dev";
            public string StartMessage = ":rocket: Сервер **{ServerName}** запущен, подключайтесь!";
            public string LoadingMessage = "(загружается)";
        }
    }
}
