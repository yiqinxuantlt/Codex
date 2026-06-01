# GitHub SSH 推送配置

当前仓库：`yiqinxuantlt/Codex`

## 为什么建议改用 SSH

这个仓库之前用 HTTPS 推送时出现过凭据读取不稳定的问题，例如系统凭据不可用或认证过程卡住。SSH 配好以后会用本机私钥认证，日常推送通常更稳定。

## 推荐步骤

1. 生成专用 SSH key：

   ```powershell
   ssh-keygen -t ed25519 -C "yiqinxuantlt GitHub" -f "$env:USERPROFILE\.ssh\id_ed25519_github" -N ""
   ```

2. 查看公钥内容：

   ```powershell
   Get-Content "$env:USERPROFILE\.ssh\id_ed25519_github.pub"
   ```

3. 打开 GitHub 的 `Settings -> SSH and GPG keys -> New SSH key`，把上一步输出的公钥粘贴进去。

4. 测试 SSH 连接：

   ```powershell
   ssh -T git@github.com
   ```

5. 测试成功后，把仓库远程地址切换到 SSH：

   ```powershell
   git --git-dir=_git --work-tree=. remote set-url origin git@github.com:yiqinxuantlt/Codex.git
   ```

6. 之后推送：

   ```powershell
   git --git-dir=_git --work-tree=. push origin main
   ```

## 当前 HTTPS 备用配置

如果暂时还没有把公钥加到 GitHub，可以继续使用 HTTPS。这个仓库已经可以设置为 OpenSSL 后端，能绕开一部分 Windows 凭据和证书后端问题：

```powershell
git --git-dir=_git --work-tree=. config http.sslBackend openssl
```

如果 HTTPS 仍然卡住，优先完成 SSH 配置。
