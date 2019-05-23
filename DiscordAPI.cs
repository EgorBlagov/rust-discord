using System.Linq;
using Newtonsoft.Json;
using Facepunch;
using Oxide.Core.Libraries.Covalence;
using Oxide.Core.Plugins;
using System.Text.RegularExpressions;
using UnityEngine;

namespace Oxide.Plugins
{
    [Info("DiscordAPI", "Blagov Egor", "1.0.0")]
    [Description("Discord Client for Rust OxideMods")]
    class DiscordAPI : RustPlugin
    {
        const string permRead = "discordapi.read";
        const string permDisable = "discordapi.disable";
        const string permToggle = "discordapi.toggle";
        const string prefixSend = "discord.send";
        const string permTerminate = "discordapi.terminate";
        const string prefixTerminate = "discord.terminate";

        private PluginConfig config;
        private bool loaded = false;

        [PluginReference]
        Plugin BetterChatMute;

        class Role {
            public string color;
            public string name;
            public string id;
            public string ToChat() => $"<color={color}>[{name}]</color>";
            public string ToConsole() => $"[{name}]";
        }

        class Message {
            public string username;
            public string content;
            public Role[] roles = new Role[0];

            public string ToChatMessage() => $"{FormatRolesChat()}<size=15><color=#e25604>{username}</color>: {this.CleanupContent(content)}</size>";
            public string ToConsoleMessage() =>$"{FormatRolesConsole()}{username}: {this.CleanupContent(content)}";
            private string CleanupContent(string content) => new Regex("<.*?>").Replace(content, string.Empty);
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
        
        private T parseArg<T>(ConsoleSystem.Arg arg) {
            return JsonConvert.DeserializeObject<T>(arg.Args[0]);
        }

        protected override void LoadDefaultMessages() {
            lang.RegisterMessages(new System.Collections.Generic.Dictionary<string, string> {
                ["NoPermission"] = "You have no permission to use this command",
                ["Enabled"] = "Discord messages enabled",
                ["Disabled"] = "Discord messaged disabled"
            }, this, "en");

            lang.RegisterMessages(new System.Collections.Generic.Dictionary<string, string> {
                ["NoPermission"] = "У Вас нет привилегии на использование этой команды",
                ["Enabled"] = "Отображение сообщений из Discord включено",
                ["Disabled"] = "Отображение сообщений из Discord отключено"
            }, this, "ru");
        }

        [ChatCommand("discord")]
        private void ToggleDiscordCommand(BasePlayer player) {
            if (!permission.UserHasPermission(player.UserIDString, permToggle)) {
                SendReply(player, lang.GetMessage("NoPermission", this, player.UserIDString));
                return;
            }
            
            if (permission.UserHasPermission(player.UserIDString, permDisable)) {
                permission.RevokeUserPermission(player.UserIDString, permDisable);
                SendReply(player, lang.GetMessage("Enabled", this, player.UserIDString));
            } else {
                permission.GrantUserPermission(player.UserIDString, permDisable, this);
                SendReply(player, lang.GetMessage("Disabled", this, player.UserIDString));
            }
        }

        [ConsoleCommand("discord.kill")]
        private void DiscordTerminateCommand(ConsoleSystem.Arg arg) {
            if (arg.Player() != null && !permission.UserHasPermission(arg.Player().UserIDString, permTerminate)) {
                SendReply(arg.Player(), lang.GetMessage("NoPermission", this, arg.Player().UserIDString));
                return;
            }

            NextTick(() => Puts(prefixTerminate));
        }

        [ConsoleCommand("discordapi.connected")]
        private void EventDiscordConnected(ConsoleSystem.Arg arg) {
            if (arg.Player() != null) {
                return;
            }
            SendMessage(_(config.WelcomeMessage));
        }

        [ConsoleCommand("discordapi.message")]
        private void EventDiscordMessage(ConsoleSystem.Arg arg) {
            if (arg.Player() != null) {
                return;
            }

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
            permission.RegisterPermission(permToggle, this);
            permission.RegisterPermission(permTerminate, this);

            config = Config.ReadObject<PluginConfig>();
            Config.WriteObject(config);
        }

        private void OnServerInitialized(bool isGlobalInit) {
            loaded = true;

            if (isGlobalInit) {
                SendMessage(_(config.StartMessage));
            } else {
                SendMessage(_(config.WelcomeMessage));
            }
        }

        private void Unload() {
            SendMessage(_(config.GoodbyeMessage));
        }

        private string _(string input) => input
            .Replace("{ServerName}", config.ServerName)
            .Replace("{Loading}", loaded ? "" : config.LoadingMessage);

        private string _(string input, string name, string message) => input
            .Replace("{Name}", name)
            .Replace("{Message}", message);

        private void OnPlayerInit(BasePlayer player) {
            this.SendMessage($":ballot_box_with_check: **{player.displayName}** присоединился к игре");
        }

        private void OnPlayerDisconnected(BasePlayer player, string reason) {
            this.SendMessage($":x: **{player.displayName}** вышел с сервера, причина: **{reason}**");
        }

        private object OnUserChat(IPlayer player, string message) {
            if (string.IsNullOrEmpty(message)) {
                return null;
            }

            if (BetterChatMute != null && BetterChatMute.Call<bool>("API_IsMuted", player)) {
                return null;
            }

            string baseMessage = _(config.PlayerMessage, player.Name, message);
            foreach (var trigger in config.AdminTriggers) {
                if (message.ToLower().Contains(trigger)) {
                    baseMessage = $"@{config.AdminRoleName} {baseMessage}";
                    break;
                }
            }
            this.SendMessage(baseMessage);
            return null;
        }

        private object OnServerMessage(string message, string name, string color, ulong id) {
            this.SendMessage(_(config.ServerMessage, name, message));
            return null;
        }

        #region API
        void SendMessage(string MessageText) {
            NextTick(() => Puts($"{prefixSend}{MessageText}"));
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
            public string PlayerMessage = ":speech_balloon: **{Name}**: {Message}";
            public string ServerMessage = ":loudspeaker: **{Name}:** {Message}";
            public string LoadingMessage = "(загружается)";
            public string[] AdminTriggers = new string[] {
                "адм",
                "аниме",
                "сервер",
                "вайп",
                "wipe",
                "server"
            };
            public string AdminRoleName = "Admin";
        }
    }
}
